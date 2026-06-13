"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.coursePayments = exports.courseAnnouncements = exports.lessonQuestions = exports.userCourseBadges = exports.quizAttempts = exports.quizQuestions = exports.courseQuizzes = exports.courseCertificates = exports.courseReviews = exports.lessonProgress = exports.courseEnrollments = exports.courseLessons = exports.courseSections = exports.ticketEmbeddings = exports.feedbackStatusHistoryRelations = exports.feedbackStatusHistory = exports.projectComments = exports.projectFavorites = exports.projectLikes = exports.eventWaitlist = exports.eventRegistrationAnswers = exports.eventRegistrationQuestions = exports.eventSessions = exports.eventSpeakers = exports.newsletters = void 0;
// Enums
__exportStar(require("./enums"), exports);
// Tables + Relations
__exportStar(require("./analytics"), exports);
__exportStar(require("./users"), exports);
__exportStar(require("./applications"), exports);
__exportStar(require("./auth"), exports);
__exportStar(require("./audit"), exports);
__exportStar(require("./verification"), exports);
__exportStar(require("./content"), exports);
var content_1 = require("./content");
Object.defineProperty(exports, "newsletters", { enumerable: true, get: function () { return content_1.newsletters; } });
// Re-export new event tables explicitly (added to content.ts)
var content_2 = require("./content");
Object.defineProperty(exports, "eventSpeakers", { enumerable: true, get: function () { return content_2.eventSpeakers; } });
Object.defineProperty(exports, "eventSessions", { enumerable: true, get: function () { return content_2.eventSessions; } });
Object.defineProperty(exports, "eventRegistrationQuestions", { enumerable: true, get: function () { return content_2.eventRegistrationQuestions; } });
Object.defineProperty(exports, "eventRegistrationAnswers", { enumerable: true, get: function () { return content_2.eventRegistrationAnswers; } });
Object.defineProperty(exports, "eventWaitlist", { enumerable: true, get: function () { return content_2.eventWaitlist; } });
// Project interaction tables
var content_3 = require("./content");
Object.defineProperty(exports, "projectLikes", { enumerable: true, get: function () { return content_3.projectLikes; } });
Object.defineProperty(exports, "projectFavorites", { enumerable: true, get: function () { return content_3.projectFavorites; } });
Object.defineProperty(exports, "projectComments", { enumerable: true, get: function () { return content_3.projectComments; } });
__exportStar(require("./mentorship"), exports);
__exportStar(require("./feed"), exports);
__exportStar(require("./meetings"), exports);
__exportStar(require("./notifications"), exports);
__exportStar(require("./social"), exports);
__exportStar(require("./media"), exports);
__exportStar(require("./community"), exports);
var community_1 = require("./community");
Object.defineProperty(exports, "feedbackStatusHistory", { enumerable: true, get: function () { return community_1.feedbackStatusHistory; } });
Object.defineProperty(exports, "feedbackStatusHistoryRelations", { enumerable: true, get: function () { return community_1.feedbackStatusHistoryRelations; } });
Object.defineProperty(exports, "ticketEmbeddings", { enumerable: true, get: function () { return community_1.ticketEmbeddings; } });
__exportStar(require("./donations"), exports);
__exportStar(require("./payments"), exports);
__exportStar(require("./marketplace"), exports);
__exportStar(require("./store"), exports);
__exportStar(require("./competitions"), exports);
__exportStar(require("./exams"), exports);
__exportStar(require("./surveys"), exports);
__exportStar(require("./clubs"), exports);
__exportStar(require("./trainings"), exports);
var trainings_1 = require("./trainings");
Object.defineProperty(exports, "courseSections", { enumerable: true, get: function () { return trainings_1.courseSections; } });
Object.defineProperty(exports, "courseLessons", { enumerable: true, get: function () { return trainings_1.courseLessons; } });
Object.defineProperty(exports, "courseEnrollments", { enumerable: true, get: function () { return trainings_1.courseEnrollments; } });
Object.defineProperty(exports, "lessonProgress", { enumerable: true, get: function () { return trainings_1.lessonProgress; } });
Object.defineProperty(exports, "courseReviews", { enumerable: true, get: function () { return trainings_1.courseReviews; } });
Object.defineProperty(exports, "courseCertificates", { enumerable: true, get: function () { return trainings_1.courseCertificates; } });
Object.defineProperty(exports, "courseQuizzes", { enumerable: true, get: function () { return trainings_1.courseQuizzes; } });
Object.defineProperty(exports, "quizQuestions", { enumerable: true, get: function () { return trainings_1.quizQuestions; } });
Object.defineProperty(exports, "quizAttempts", { enumerable: true, get: function () { return trainings_1.quizAttempts; } });
Object.defineProperty(exports, "userCourseBadges", { enumerable: true, get: function () { return trainings_1.userCourseBadges; } });
Object.defineProperty(exports, "lessonQuestions", { enumerable: true, get: function () { return trainings_1.lessonQuestions; } });
Object.defineProperty(exports, "courseAnnouncements", { enumerable: true, get: function () { return trainings_1.courseAnnouncements; } });
Object.defineProperty(exports, "coursePayments", { enumerable: true, get: function () { return trainings_1.coursePayments; } });
__exportStar(require("./qa"), exports);
__exportStar(require("./scheduling"), exports);
__exportStar(require("./newsletter-automations"), exports);
__exportStar(require("./newsletter-subscribers"), exports);
