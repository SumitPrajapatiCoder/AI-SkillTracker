const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const {
    uploadQuestion,blockUser,unblockUser,deleteUser,
    deleteQuestion,toggleAdminRole,
    listAllQuestions,
    listAllUsers,generateAIQuestion,editQuestion
} = require("../controller/adminControl");


router.post("/upload-question", authMiddleware, adminMiddleware, uploadQuestion);
router.delete("/delete-question/:id", authMiddleware, adminMiddleware, deleteQuestion);
router.get("/all-questions", authMiddleware, adminMiddleware, listAllQuestions);
router.get("/all-users", authMiddleware, adminMiddleware, listAllUsers);
router.put("/block-user/:id", authMiddleware, adminMiddleware, blockUser);
router.put("/unblock-user/:id", authMiddleware, adminMiddleware, unblockUser);
router.put("/toggle-admin/:id", authMiddleware, adminMiddleware, toggleAdminRole);
router.delete("/delete-user/:id", authMiddleware, adminMiddleware, deleteUser);
router.post("/generate-ai", authMiddleware, adminMiddleware, generateAIQuestion);
router.put("/edit-question/:id", authMiddleware, adminMiddleware ,editQuestion);

module.exports = router;
