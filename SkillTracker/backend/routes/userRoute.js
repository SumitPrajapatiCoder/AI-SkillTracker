const express = require("express");
const { loginController, registerController,getUserInfo,generateRoadMap,getStudyPlans,saveStudyPlan,
    getRoadmaps, saveRoadmap, getLanguages, getMockCardDetails, getQuizCardDetails,getCompletedMocks,
updateProfileController,saveMockResult,getMockStatus,saveQuizResult,generateStudyPlan,chatbotController,
getUserProgress} = require("../controller/userControl");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/login", loginController);
router.post("/register", registerController);
router.post('/get_User_data', authMiddleware, getUserInfo);
router.put('/update_profile', authMiddleware, updateProfileController);


router.get("/get-languages", authMiddleware, getLanguages);

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

router.get("/get-quiz-cards", authMiddleware,getQuizCardDetails);
router.get("/get-mock-cards", authMiddleware,getMockCardDetails);

router.get("/completed-mocks", authMiddleware, getCompletedMocks);
router.post("/chatbot", authMiddleware, chatbotController);

module.exports = router;