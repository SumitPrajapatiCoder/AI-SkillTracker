const express = require("express");
const { loginController, registerController,getUserInfo,generateRoadMap,getStudyPlans,saveStudyPlan,getRoadmaps,saveRoadmap,
updateProfileController,saveMockResult,getMockStatus,saveQuizResult,generateStudyPlan,getUserProgress} = require("../controller/userControl");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/login", loginController);
router.post("/register", registerController);
router.post('/get_User_data', authMiddleware, getUserInfo);
router.put('/update_profile', authMiddleware, updateProfileController);


router.post("/save-quiz-result", authMiddleware, saveQuizResult);
router.post("/save-mock-result",authMiddleware,saveMockResult);
router.get("/mock-status/:language",authMiddleware,getMockStatus);


router.get("/study-plans", authMiddleware, getStudyPlans);
router.get("/study-plan", authMiddleware, generateStudyPlan);
router.post("/study-plan/save", authMiddleware, saveStudyPlan);


router.get("/roadmaps", authMiddleware, getRoadmaps);
router.get("/roadmap", authMiddleware, generateRoadMap);
router.post("/roadmap/save", authMiddleware, saveRoadmap);

router.get("/progress", authMiddleware, getUserProgress);

module.exports = router;