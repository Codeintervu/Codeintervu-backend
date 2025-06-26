import Tutorial from "../models/Tutorial.js";
import { cloudinary } from "../config/cloudinary.js";

// @desc    Fetch all tutorials
// @route   GET /api/tutorials
// @access  Public
export const getTutorials = async (req, res) => {
  try {
    const filter = req.query.category ? { category: req.query.category } : {};
    const tutorials = await Tutorial.find(filter).populate("category", "name");
    res.json(tutorials);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Fetch a single tutorial
// @route   GET /api/tutorials/:id
// @access  Public
export const getTutorialById = async (req, res) => {
  try {
    const tutorial = await Tutorial.findById(req.params.id).populate(
      "category",
      "name"
    );
    if (tutorial) {
      res.json(tutorial);
    } else {
      res.status(404).json({ message: "Tutorial not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Create a new tutorial
// @route   POST /api/tutorials
// @access  Private/Admin
export const createTutorial = async (req, res) => {
  const { title, category, sections } = req.body;
  try {
    const tutorial = new Tutorial({ title, category, sections });
    const createdTutorial = await tutorial.save();
    res.status(201).json(createdTutorial);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Helper for default compiler
const defaultCompiler = () => ({
  enabled: false,
  language: "java",
  boilerplate: "",
  editable: true,
});

function sanitizeCompiler(compiler) {
  return {
    enabled: typeof compiler?.enabled === "boolean" ? compiler.enabled : false,
    language:
      typeof compiler?.language === "string" ? compiler.language : "java",
    boilerplate:
      typeof compiler?.boilerplate === "string" ? compiler.boilerplate : "",
    editable:
      typeof compiler?.editable === "boolean" ? compiler.editable : true,
  };
}

// @desc    Add a section to a tutorial
// @route   POST /api/tutorials/:id/sections
// @access  Private/Admin
export const addSectionToTutorial = async (req, res) => {
  const {
    heading,
    youtubeUrl,
    contentBlocks,
    compilerEnabled,
    compilerLanguage,
    compilerBoilerplate,
  } = req.body;
  const { id } = req.params;

  try {
    let parsedContentBlocks = JSON.parse(contentBlocks);
    const contentBlockFiles = req.files?.contentBlockMedia || [];
    const mainMediaFile = req.files?.mainMedia ? req.files.mainMedia[0] : null;

    // Assign uploaded media URLs to their corresponding content blocks
    parsedContentBlocks.forEach((block) => {
      if (block.fileIndex !== undefined) {
        const fileForBlock = contentBlockFiles[block.fileIndex];
        if (fileForBlock) {
          block.mediaUrl = fileForBlock.path;
        }
        delete block.fileIndex; // Clean up the temporary index
      }
      // Ensure compiler field exists and is valid
      block.compiler = sanitizeCompiler(block.compiler);
      // Ensure syntaxEnabled and syntax are preserved
      block.syntaxEnabled = !!block.syntaxEnabled;
      block.syntax = block.syntax || "";
    });

    const newSection = {
      heading,
      youtubeUrl,
      contentBlocks: parsedContentBlocks,
      compiler: {
        enabled: compilerEnabled === "true" || compilerEnabled === true,
        language: compilerLanguage || "java",
        boilerplate: compilerBoilerplate || "",
      },
    };

    if (mainMediaFile) {
      newSection.mediaUrl = mainMediaFile.path;
    }

    const updatedTutorial = await Tutorial.findByIdAndUpdate(
      id,
      { $push: { sections: newSection } },
      { new: true, runValidators: true }
    );

    if (updatedTutorial) {
      res.status(201).json(updatedTutorial);
    } else {
      res.status(404).json({ message: "Tutorial not found" });
    }
  } catch (error) {
    console.error("Upload Error:", error);
    console.error("Upload Error (stringified):", JSON.stringify(error));
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Delete a tutorial
// @route   DELETE /api/tutorials/:id
// @access  Private/Admin
export const deleteTutorial = async (req, res) => {
  try {
    const tutorial = await Tutorial.findById(req.params.id);

    if (tutorial) {
      await tutorial.deleteOne();
      res.json({ message: "Tutorial removed" });
    } else {
      res.status(404).json({ message: "Tutorial not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Delete a section from a tutorial
// @route   DELETE /api/tutorials/:tutorialId/sections/:sectionId
// @access  Private/Admin
export const deleteTutorialSection = async (req, res) => {
  try {
    const tutorial = await Tutorial.findById(req.params.tutorialId).lean();

    if (tutorial) {
      const section = tutorial.sections.find(
        (sec) => sec._id.toString() === req.params.sectionId
      );

      if (!section) {
        return res.status(404).json({ message: "Section not found" });
      }

      // Delete image(s) from Cloudinary if they exist.
      // Handles both old (array) and new (string) data formats.
      if (section.mediaUrl) {
        try {
          const urls = Array.isArray(section.mediaUrl)
            ? section.mediaUrl
            : [section.mediaUrl];
          for (const url of urls) {
            if (url && url.includes("cloudinary.com")) {
              const publicId = url.split("/").pop().split(".")[0];
              await cloudinary.uploader.destroy(publicId);
            }
          }
        } catch (cloudinaryError) {
          console.error("Error deleting from Cloudinary:", cloudinaryError);
        }
      }

      await Tutorial.findByIdAndUpdate(req.params.tutorialId, {
        $pull: { sections: { _id: req.params.sectionId } },
      });

      res.json({ message: "Section removed" });
    } else {
      res.status(404).json({ message: "Tutorial not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Update a section in a tutorial
// @route   PUT /api/tutorials/:tutorialId/sections/:sectionId
// @access  Private/Admin
export const updateTutorialSection = async (req, res) => {
  const {
    heading,
    youtubeUrl,
    contentBlocks,
    compilerEnabled,
    compilerLanguage,
    compilerBoilerplate,
  } = req.body;
  const { tutorialId, sectionId } = req.params;

  try {
    const tutorial = await Tutorial.findById(tutorialId).lean();
    if (!tutorial) {
      return res.status(404).json({ message: "Tutorial not found" });
    }

    const oldSection = tutorial.sections.find(
      (s) => s._id.toString() === sectionId
    );
    if (!oldSection) {
      return res.status(404).json({ message: "Section not found" });
    }

    let updatedBlocks = JSON.parse(contentBlocks);
    const contentBlockFiles = req.files?.contentBlockMedia || [];
    const mainMediaFile = req.files?.mainMedia ? req.files.mainMedia[0] : null;
    let newMainMediaUrl = oldSection.mediaUrl;

    // --- Handle Main Media ---
    if (mainMediaFile) {
      // If new main media, delete old one from Cloudinary
      if (
        oldSection.mediaUrl &&
        oldSection.mediaUrl.includes("cloudinary.com")
      ) {
        try {
          const publicId = oldSection.mediaUrl.split("/").pop().split(".")[0];
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.error("Failed to delete old main media", err);
        }
      }
      newMainMediaUrl = mainMediaFile.path;
    }

    // --- Handle Content Block Media ---
    const oldMediaUrls = new Map(
      oldSection.contentBlocks.map((b) => [b._id.toString(), b.mediaUrl])
    );
    const newMediaUrls = new Set();

    // Map new file URLs to content blocks
    updatedBlocks.forEach((block) => {
      if (block.fileIndex !== undefined) {
        const fileForBlock = contentBlockFiles[block.fileIndex];
        if (fileForBlock) {
          block.mediaUrl = fileForBlock.path;
          newMediaUrls.add(block.mediaUrl);
        }
        delete block.fileIndex;
      } else if (block._id) {
        // If no new file, retain the old URL
        block.mediaUrl = oldMediaUrls.get(block._id.toString());
        if (block.mediaUrl) newMediaUrls.add(block.mediaUrl);
      }
      // Ensure compiler field exists and is valid
      block.compiler = sanitizeCompiler(block.compiler);
      // Ensure syntaxEnabled and syntax are preserved
      block.syntaxEnabled = !!block.syntaxEnabled;
      block.syntax = block.syntax || "";
    });

    // --- Delete Unused Content Block Media from Cloudinary ---
    for (const [id, url] of oldMediaUrls.entries()) {
      if (url && url.includes("cloudinary.com") && !newMediaUrls.has(url)) {
        try {
          const publicId = url.split("/").pop().split(".")[0];
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.error(`Failed to delete unused media ${url}`, err);
        }
      }
    }

    // --- Prepare and execute atomic update ---
    const updateFields = {
      "sections.$.heading": heading,
      "sections.$.youtubeUrl": youtubeUrl,
      "sections.$.contentBlocks": updatedBlocks,
      "sections.$.mediaUrl": newMainMediaUrl,
      "sections.$.compiler": {
        enabled: compilerEnabled === "true" || compilerEnabled === true,
        language: compilerLanguage || "java",
        boilerplate: compilerBoilerplate || "",
      },
    };

    const updatedTutorial = await Tutorial.findOneAndUpdate(
      { _id: tutorialId, "sections._id": sectionId },
      { $set: updateFields },
      { new: true }
    );

    if (!updatedTutorial) {
      return res.status(404).json({ message: "Tutorial or section not found" });
    }

    res.json(updatedTutorial);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};
