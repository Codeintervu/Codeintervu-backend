import express from "express";
import { adminAuth } from "../middleware/auth.js";
import { google } from "googleapis";

const router = express.Router();

// Initialize Google Analytics
const analytics = google.analytics("v3");
const analyticsData = google.analyticsdata("v1beta");

// Google Analytics configuration
const SCOPES = ["https://www.googleapis.com/auth/analytics.readonly"];

// Handle both local development and production
const getKeyFilePath = () => {
  if (process.env.NODE_ENV === "production") {
    // In production (Render), use environment variable for key content
    return process.env.GOOGLE_ANALYTICS_KEY_CONTENT;
  }
  // In development, use local file
  return (
    process.env.GOOGLE_APPLICATION_CREDENTIALS || "./google-analytics-key.json"
  );
};

// Get Google Analytics client
const getAnalyticsClient = async () => {
  try {
    let auth;

    if (process.env.NODE_ENV === "production") {
      // In production, use key content from environment variable
      const keyContent = process.env.GOOGLE_ANALYTICS_KEY_CONTENT;
      if (!keyContent) {
        console.log("Google Analytics key content not found in production");
        return null;
      }

      auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(keyContent),
        scopes: SCOPES,
      });
    } else {
      // In development, use local file
      auth = new google.auth.GoogleAuth({
        keyFile: getKeyFilePath(),
        scopes: SCOPES,
      });
    }

    const authClient = await auth.getClient();
    return { analytics: analyticsData, auth: authClient };
  } catch (error) {
    console.error("Error initializing Google Analytics client:", error);
    return null;
  }
};

// Real-time analytics endpoint
router.get("/realtime", adminAuth, async (req, res) => {
  try {
    const client = await getAnalyticsClient();

    if (!client) {
      // Fallback to database analytics
      return res.json(await getDatabaseAnalytics());
    }

    // Get real-time data from GA4
    const response = await client.analytics.properties.runRealtimeReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      auth: client.auth,
      requestBody: {
        dimensions: [{ name: "pagePath" }, { name: "deviceCategory" }],
        metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }],
      },
    });

    const realtimeData = {
      currentUsers: response.data.rows?.[0]?.metricValues?.[0]?.value || 0,
      pageViews: response.data.rows?.[0]?.metricValues?.[1]?.value || 0,
      activePages:
        response.data.rows?.slice(0, 5).map((row) => ({
          page: row.dimensionValues[0].value,
          users: parseInt(row.metricValues[0].value) || 0,
        })) || [],
      recentActivity: await getRecentActivity(),
      systemStatus: "healthy",
      errors: await getSystemErrors(),
      warnings: await getSystemWarnings(),
    };

    res.json(realtimeData);
  } catch (error) {
    console.error("Error fetching real-time analytics:", error);
    // Fallback to database analytics
    res.json(await getDatabaseAnalytics());
  }
});

// Overview analytics endpoint
router.get("/overview", adminAuth, async (req, res) => {
  try {
    const { range = "7d" } = req.query;
    const client = await getAnalyticsClient();

    if (!client) {
      return res.json(await getDatabaseOverview(range));
    }

    // Get overview data from GA4
    const response = await client.analytics.properties.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      auth: client.auth,
      requestBody: {
        dateRanges: [getDateRange(range)],
        metrics: [
          { name: "totalUsers" },
          { name: "activeUsers" },
          { name: "screenPageViews" },
          { name: "sessions" },
          { name: "bounceRate" },
          { name: "averageSessionDuration" },
        ],
      },
    });

    const overviewData = {
      totalUsers:
        parseInt(response.data.rows?.[0]?.metricValues?.[0]?.value) || 0,
      activeUsers:
        parseInt(response.data.rows?.[0]?.metricValues?.[1]?.value) || 0,
      pageViews:
        parseInt(response.data.rows?.[0]?.metricValues?.[2]?.value) || 0,
      sessions:
        parseInt(response.data.rows?.[0]?.metricValues?.[3]?.value) || 0,
      bounceRate:
        parseFloat(response.data.rows?.[0]?.metricValues?.[4]?.value) || 0,
      avgSessionDuration: formatDuration(
        response.data.rows?.[0]?.metricValues?.[5]?.value
      ),
      // Add source indicator
      dataSource: "ga4",
      note: "Website visitors (includes anonymous users)",
    };

    res.json(overviewData);
  } catch (error) {
    console.error("Error fetching overview analytics:", error);
    res.json(await getDatabaseOverview(req.query.range));
  }
});

// Performance analytics endpoint
router.get("/performance", adminAuth, async (req, res) => {
  try {
    const client = await getAnalyticsClient();

    if (!client) {
      return res.json(await getDatabasePerformance());
    }

    // Get performance data from GA4
    const response = await client.analytics.properties.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      auth: client.auth,
      requestBody: {
        dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
        metrics: [{ name: "screenPageViews" }, { name: "sessions" }],
        dimensions: [{ name: "deviceCategory" }],
      },
    });

    const performanceData = {
      pageSpeed: {
        mobile: calculatePageSpeed(response.data.rows, "mobile"),
        desktop: calculatePageSpeed(response.data.rows, "desktop"),
      },
      pageViews: response.data.rows?.[0]?.metricValues?.[0]?.value || 0,
      sessions: response.data.rows?.[0]?.metricValues?.[1]?.value || 0,
      coreWebVitals: await getCoreWebVitals(),
      errors: await getSystemErrors(),
    };

    res.json(performanceData);
  } catch (error) {
    console.error("Error fetching performance analytics:", error);
    res.json(await getDatabasePerformance());
  }
});

// User analytics endpoint
router.get("/users", adminAuth, async (req, res) => {
  try {
    const client = await getAnalyticsClient();

    if (!client) {
      return res.json(await getDatabaseUsers());
    }

    // Get user data from GA4
    const response = await client.analytics.properties.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      auth: client.auth,
      requestBody: {
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        metrics: [{ name: "totalUsers" }],
        dimensions: [{ name: "deviceCategory" }, { name: "browser" }],
      },
    });

    const userData = {
      devices: processDeviceData(response.data.rows, "deviceCategory"),
      browsers: processBrowserData(response.data.rows, "browser"),
    };

    res.json(userData);
  } catch (error) {
    console.error("Error fetching user analytics:", error);
    res.json(await getDatabaseUsers());
  }
});

// Content analytics endpoint
router.get("/content", adminAuth, async (req, res) => {
  try {
    const client = await getAnalyticsClient();

    if (!client) {
      return res.json(await getDatabaseContent());
    }

    // Get content data from GA4
    const response = await client.analytics.properties.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      auth: client.auth,
      requestBody: {
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        metrics: [
          { name: "screenPageViews" },
          { name: "averageSessionDuration" },
        ],
        dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 10,
      },
    });

    const contentData = {
      topPages:
        response.data.rows?.slice(0, 5).map((row) => ({
          page: row.dimensionValues[0].value,
          views: parseInt(row.metricValues[0].value) || 0,
          change: calculateChange(row.dimensionValues[0].value),
        })) || [],
      topCategories: await getContentCategories(),
    };

    res.json(contentData);
  } catch (error) {
    console.error("Error fetching content analytics:", error);
    res.json(await getDatabaseContent());
  }
});

// Traffic analytics endpoint
router.get("/traffic", adminAuth, async (req, res) => {
  try {
    const client = await getAnalyticsClient();

    if (!client) {
      return res.json(await getDatabaseTraffic());
    }

    // Get traffic data from GA4
    const response = await client.analytics.properties.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      auth: client.auth,
      requestBody: {
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        metrics: [{ name: "totalUsers" }],
        dimensions: [{ name: "source" }, { name: "country" }],
      },
    });

    const trafficData = {
      sources: processTrafficSources(response.data.rows),
      countries: processTrafficCountries(response.data.rows),
    };

    res.json(trafficData);
  } catch (error) {
    console.error("Error fetching traffic analytics:", error);
    res.json(await getDatabaseTraffic());
  }
});

// Helper functions
function getDateRange(range) {
  const endDate = "today";
  let startDate;

  switch (range) {
    case "1d":
      startDate = "1daysAgo";
      break;
    case "7d":
      startDate = "7daysAgo";
      break;
    case "30d":
      startDate = "30daysAgo";
      break;
    case "90d":
      startDate = "90daysAgo";
      break;
    default:
      startDate = "7daysAgo";
  }

  return { startDate, endDate };
}

function formatDuration(seconds) {
  if (!seconds) return "0m 0s";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m ${secs}s`;
}

function calculatePageSpeed(rows, device) {
  // This would need to be implemented based on your specific needs
  // For now, returning a default value
  return device === "mobile" ? 78 : 92;
}

function calculateChange(pagePath) {
  // This would need to be implemented to compare with previous period
  // For now, returning a random change value
  return Math.floor(Math.random() * 20) - 10;
}

function processDeviceData(rows, dimensionName) {
  if (!rows) return [];

  const deviceMap = new Map();
  rows.forEach((row) => {
    const device =
      row.dimensionValues.find((d) => d.name === dimensionName)?.value ||
      "Unknown";
    const users = parseInt(row.metricValues[0].value) || 0;
    deviceMap.set(device, (deviceMap.get(device) || 0) + users);
  });

  const total = Array.from(deviceMap.values()).reduce(
    (sum, users) => sum + users,
    0
  );

  return Array.from(deviceMap.entries()).map(([device, users]) => ({
    device,
    users,
    percentage: total > 0 ? Math.round((users / total) * 100) : 0,
  }));
}

function processBrowserData(rows, dimensionName) {
  if (!rows) return [];

  const browserMap = new Map();
  rows.forEach((row) => {
    const browser =
      row.dimensionValues.find((d) => d.name === dimensionName)?.value ||
      "Unknown";
    const users = parseInt(row.metricValues[0].value) || 0;
    browserMap.set(browser, (browserMap.get(browser) || 0) + users);
  });

  const total = Array.from(browserMap.values()).reduce(
    (sum, users) => sum + users,
    0
  );

  return Array.from(browserMap.entries()).map(([browser, users]) => ({
    browser,
    users,
    percentage: total > 0 ? Math.round((users / total) * 100) : 0,
  }));
}

function processTrafficSources(rows) {
  if (!rows) return [];

  const sourceMap = new Map();
  rows.forEach((row) => {
    const source = row.dimensionValues[0]?.value || "Unknown";
    const users = parseInt(row.metricValues[0].value) || 0;
    sourceMap.set(source, (sourceMap.get(source) || 0) + users);
  });

  const total = Array.from(sourceMap.values()).reduce(
    (sum, users) => sum + users,
    0
  );

  return Array.from(sourceMap.entries()).map(([source, users]) => ({
    source,
    users,
    percentage: total > 0 ? Math.round((users / total) * 100) : 0,
  }));
}

function processTrafficCountries(rows) {
  if (!rows) return [];

  const countryMap = new Map();
  rows.forEach((row) => {
    const country = row.dimensionValues[1]?.value || "Unknown";
    const users = parseInt(row.metricValues[0].value) || 0;
    countryMap.set(country, (countryMap.get(country) || 0) + users);
  });

  const total = Array.from(countryMap.values()).reduce(
    (sum, users) => sum + users,
    0
  );

  return Array.from(countryMap.entries()).map(([country, users]) => ({
    country,
    users,
    percentage: total > 0 ? Math.round((users / total) * 100) : 0,
  }));
}

// Database fallback functions (implement these based on your database schema)
async function getDatabaseAnalytics() {
  // Implement database queries for analytics
  return {
    currentUsers: 0,
    pageViews: 0,
    activePages: [],
    recentActivity: [],
    systemStatus: "healthy",
    errors: 0,
    warnings: 0,
  };
}

async function getDatabaseOverview(range) {
  // Get actual user count from database
  try {
    const User = await import("../models/User.js");
    const totalUsers = await User.default.countDocuments();

    return {
      totalUsers: totalUsers,
      activeUsers: totalUsers, // For now, assume all users are active
      pageViews: 0, // You can implement page view tracking if needed
      sessions: 0, // You can implement session tracking if needed
      bounceRate: 0,
      avgSessionDuration: "0m 0s",
      // Add source indicator
      dataSource: "database",
      note: "Registered users only",
    };
  } catch (error) {
    console.error("Error getting database overview:", error);
    return {
      totalUsers: 0,
      activeUsers: 0,
      pageViews: 0,
      sessions: 0,
      bounceRate: 0,
      avgSessionDuration: "0m 0s",
    };
  }
}

async function getDatabasePerformance() {
  // Implement database queries for performance
  return {
    pageSpeed: { mobile: 0, desktop: 0 },
    coreWebVitals: { lcp: 0, fid: 0, cls: 0 },
    errors: { total: 0, critical: 0, warnings: 0 },
  };
}

async function getDatabaseUsers() {
  try {
    const User = await import("../models/User.js");
    const users = await User.default.find({}).select("device browser -_id");

    // Count devices and browsers from actual user data
    const deviceMap = new Map();
    const browserMap = new Map();

    users.forEach((user) => {
      const device = user.device || "Unknown";
      const browser = user.browser || "Unknown";

      deviceMap.set(device, (deviceMap.get(device) || 0) + 1);
      browserMap.set(browser, (browserMap.get(browser) || 0) + 1);
    });

    const totalUsers = users.length;

    return {
      devices: Array.from(deviceMap.entries()).map(([device, count]) => ({
        device,
        users: count,
        percentage: totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0,
      })),
      browsers: Array.from(browserMap.entries()).map(([browser, count]) => ({
        browser,
        users: count,
        percentage: totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0,
      })),
    };
  } catch (error) {
    console.error("Error getting database users:", error);
    return {
      devices: [],
      browsers: [],
    };
  }
}

async function getDatabaseContent() {
  // Implement database queries for content
  return {
    topPages: [],
    topCategories: [],
  };
}

async function getDatabaseTraffic() {
  // Implement database queries for traffic
  return {
    sources: [],
    countries: [],
  };
}

// Additional helper functions (implement these based on your needs)
async function getRecentActivity() {
  // Implement to get recent user activity from your database
  return [];
}

async function getSystemErrors() {
  // Implement to get system errors from your logs/database
  return 0;
}

async function getSystemWarnings() {
  // Implement to get system warnings from your logs/database
  return 0;
}

async function getCoreWebVitals() {
  // Implement to get Core Web Vitals from your monitoring system
  return { lcp: 0, fid: 0, cls: 0 };
}

async function getContentCategories() {
  // Implement to get content categories from your database
  return [];
}

export default router;
