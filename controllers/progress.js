import User from "../models/User.js";

export const saveSectionResult = async (req, res) => {
  try {
    const {
      quizId,
      quizName,
      sectionIndex,
      score,
      totalQuestions,
      correctAnswers,
      timeSpent,
      accuracy,
    } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.quizResults.unshift({
      quizId,
      quizName: quizName || "",
      sectionIndex: sectionIndex ?? null,
      score: score ?? 0,
      totalQuestions: totalQuestions ?? 0,
      correctAnswers: correctAnswers ?? 0,
      timeSpent: timeSpent ?? 0,
      accuracy: accuracy ?? 0,
      completedAt: new Date(),
    });

    // keep last 100 results
    if (user.quizResults.length > 100) {
      user.quizResults = user.quizResults.slice(0, 100);
    }

    await user.save();
    return res.json({ message: "Result saved" });
  } catch (e) {
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const updateResume = async (req, res) => {
  try {
    const { quizId, currentSection, currentQuestion, timeSpent } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const value = user.resumeProgress.get(quizId) || {};
    value.currentSection = currentSection ?? value.currentSection ?? 0;
    value.currentQuestion = currentQuestion ?? value.currentQuestion ?? 0;
    value.timeSpent = timeSpent ?? value.timeSpent ?? 0;
    value.updatedAt = new Date();

    user.resumeProgress.set(quizId, value);
    await user.save();
    return res.json({ message: "Resume updated" });
  } catch (e) {
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const getResume = async (req, res) => {
  try {
    const { quizId } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const value = user.resumeProgress.get(quizId) || null;
    return res.json(value);
  } catch (e) {
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const listBookmarks = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("quizBookmarks");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(user.quizBookmarks || []);
  } catch (e) {
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const addBookmark = async (req, res) => {
  try {
    const { questionId, quizId, quizName, question, note } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // replace if exists
    user.quizBookmarks = (user.quizBookmarks || []).filter(
      (b) => b.questionId !== questionId
    );
    user.quizBookmarks.unshift({
      questionId,
      quizId,
      quizName: quizName || "",
      question: question || "",
      note: note || "",
    });
    // keep last 200
    if (user.quizBookmarks.length > 200) {
      user.quizBookmarks = user.quizBookmarks.slice(0, 200);
    }
    await user.save();
    return res.json({ message: "Bookmarked" });
  } catch (e) {
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const deleteBookmark = async (req, res) => {
  try {
    const { questionId } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.quizBookmarks = (user.quizBookmarks || []).filter(
      (b) => b.questionId !== questionId
    );
    await user.save();
    return res.json({ message: "Removed" });
  } catch (e) {
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const getRecent = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("quizResults");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(user.quizResults || []);
  } catch (e) {
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const getSummary = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("quizResults");
    if (!user) return res.status(404).json({ message: "User not found" });
    const results = user.quizResults || [];
    if (results.length === 0) {
      return res.json({
        averageScore: 0,
        totalQuizzes: 0,
        totalTimeSpent: 0,
        studyStreak: 0,
        improvementTrend: "neutral",
      });
    }
    const totalScore = results.reduce(
      (s, r) => s + (r.score || r.accuracy || 0),
      0
    );
    const averageScore = Math.round(totalScore / results.length);
    const totalTimeSpent = results.reduce((s, r) => s + (r.timeSpent || 0), 0);
    // naive streak based on completion date
    const dates = Array.from(
      new Set(results.map((r) => new Date(r.completedAt).toDateString()))
    )
      .sort()
      .reverse();
    let streak = 0;
    for (let i = 0; i < dates.length; i++) {
      const d = new Date(dates[i]);
      const expected = new Date();
      expected.setDate(expected.getDate() - i);
      if (d.toDateString() === expected.toDateString()) streak++;
      else break;
    }
    // trend over last 10
    const recent5 = results.slice(0, 5);
    const prev5 = results.slice(5, 10);
    let improvementTrend = "neutral";
    if (prev5.length > 0) {
      const rAvg =
        recent5.reduce((s, r) => s + (r.score || r.accuracy || 0), 0) /
        recent5.length;
      const pAvg =
        prev5.reduce((s, r) => s + (r.score || r.accuracy || 0), 0) /
        prev5.length;
      if (rAvg > pAvg + 5) improvementTrend = "improving";
      else if (rAvg < pAvg - 5) improvementTrend = "declining";
    }
    return res.json({
      averageScore,
      totalQuizzes: results.length,
      totalTimeSpent,
      studyStreak: streak,
      improvementTrend,
    });
  } catch (e) {
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};

// Import guest/local progress into the authenticated account
export const importGuestProgress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { results = [], bookmarks = [], resume = {} } = req.body || {};

    // Sanitize helpers
    const toNumber = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
    const toString = (v, d = "") => (typeof v === "string" ? v : d);
    const toDate = (v) => (v ? new Date(v) : new Date());

    // --- Results ---
    const MAX_RESULTS = 100;
    const existingKeys = new Set(
      (user.quizResults || []).map(
        (r) => `${r.quizId}|${new Date(r.completedAt).toISOString()}`
      )
    );
    let importedResults = 0;
    for (const r of results.slice(0, MAX_RESULTS)) {
      const quizId = toString(r.quizId, "");
      const completedAt = toDate(r.completedAt);
      if (!quizId) continue;
      const key = `${quizId}|${completedAt.toISOString()}`;
      if (existingKeys.has(key)) continue;
      existingKeys.add(key);
      user.quizResults.unshift({
        quizId,
        quizName: toString(r.quizName, ""),
        sectionIndex:
          r.sectionIndex == null ? null : toNumber(r.sectionIndex, 0),
        score: toNumber(r.score, 0),
        totalQuestions: toNumber(r.totalQuestions, 0),
        correctAnswers: toNumber(r.correctAnswers, 0),
        timeSpent: toNumber(r.timeSpent, 0),
        accuracy: toNumber(r.accuracy, 0),
        completedAt,
      });
      importedResults++;
    }
    if (user.quizResults.length > MAX_RESULTS) {
      user.quizResults = user.quizResults.slice(0, MAX_RESULTS);
    }

    // --- Bookmarks ---
    const MAX_BOOKMARKS = 200;
    const incomingBookmarks = Array.isArray(bookmarks) ? bookmarks : [];
    const existingBookmarkIds = new Set(
      (user.quizBookmarks || []).map((b) => String(b.questionId))
    );
    let importedBookmarks = 0;
    for (const b of incomingBookmarks.slice(0, MAX_BOOKMARKS)) {
      const questionId = toString(b.questionId, "");
      const quizId = toString(b.quizId, "");
      if (!questionId || !quizId) continue;
      if (existingBookmarkIds.has(questionId)) continue;
      existingBookmarkIds.add(questionId);
      user.quizBookmarks.unshift({
        questionId,
        quizId,
        quizName: toString(b.quizName, ""),
        question: toString(b.question, ""),
        note: toString(b.note, ""),
      });
      importedBookmarks++;
    }
    if (user.quizBookmarks && user.quizBookmarks.length > MAX_BOOKMARKS) {
      user.quizBookmarks = user.quizBookmarks.slice(0, MAX_BOOKMARKS);
    }

    // --- Resume ---
    let importedResume = 0;
    if (resume && typeof resume === "object") {
      for (const [quizId, state] of Object.entries(resume)) {
        const current = user.resumeProgress.get(quizId) || {};
        const incomingUpdated = new Date(
          state.updatedAt || state.lastUpdated || Date.now()
        );
        const currentUpdated = new Date(current.updatedAt || 0);
        if (incomingUpdated > currentUpdated) {
          user.resumeProgress.set(quizId, {
            currentSection: toNumber(
              state.currentSection,
              current.currentSection || 0
            ),
            currentQuestion: toNumber(
              state.currentQuestion,
              current.currentQuestion || 0
            ),
            timeSpent: toNumber(state.timeSpent, current.timeSpent || 0),
            updatedAt: incomingUpdated,
          });
          importedResume++;
        }
      }
    }

    await user.save();
    return res.json({ importedResults, importedBookmarks, importedResume });
  } catch (e) {
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};
