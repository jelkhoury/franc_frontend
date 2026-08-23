/**
 * @file JSDoc type definitions for Admin Analytics.
 * These contracts define the data shape expected from future backend endpoints.
 */

/**
 * @typedef {'today'|'last7days'|'last30days'|'thisMonth'|'custom'} DatePreset
 */

/**
 * @typedef {'daily'|'weekly'|'monthly'} TrendGroupBy
 */

/**
 * @typedef {Object} AnalyticsFilters
 * @property {DatePreset} [preset]
 * @property {string|null} [fromDate]
 * @property {string|null} [toDate]
 * @property {string} [serviceKey]
 * @property {string} [userId]
 * @property {string} [status]
 * @property {TrendGroupBy} [groupBy]
 * @property {string} [search]
 * @property {number} [page]
 * @property {number} [pageSize]
 * @property {string} [sortBy]
 * @property {'asc'|'desc'} [sortDir]
 */

/**
 * @typedef {Object} ServiceUsageItem
 * @property {string} serviceKey
 * @property {string} serviceName
 * @property {number} uniqueUsers
 * @property {number} activities
 * @property {number} completed
 * @property {number} completionRate
 * @property {number} activitySharePercent
 */

/**
 * @typedef {Object} MostUsedService
 * @property {string} serviceKey
 * @property {string} serviceName
 * @property {number} activityCount
 */

/**
 * @typedef {Object} AnalyticsOverview
 * @property {number} totalUsers
 * @property {number} activeUsers
 * @property {number} totalActivities
 * @property {number} completedActivities
 * @property {number} completionRate
 * @property {MostUsedService} mostUsedService
 * @property {ServiceUsageItem[]} serviceUsage
 */

/**
 * @typedef {Object} ActivityTrendPoint
 * @property {string} date
 * @property {string} label
 * @property {number} activeUsers
 * @property {number} activities
 * @property {number} completed
 */

/**
 * @typedef {Object} RecentActivityItem
 * @property {string} id
 * @property {string} userId
 * @property {string} userName
 * @property {string} userEmail
 * @property {string} activityLabel
 * @property {string} serviceKey
 * @property {string} serviceName
 * @property {string|null} result
 * @property {string} status
 * @property {string} occurredAt
 */

/**
 * @typedef {Object} PaginatedResponse
 * @property {number} page
 * @property {number} pageSize
 * @property {number} total
 * @property {number} totalPages
 */

/**
 * @typedef {Object} UserSummaryItem
 * @property {string} userId
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} email
 * @property {string|null} faculty
 * @property {string|null} major
 * @property {string[]} servicesUsed
 * @property {number} totalActivities
 * @property {number} completedActivities
 * @property {string|null} lastActivityAt
 * @property {string|null} registeredAt
 */

/**
 * @typedef {Object} UserActivitySummary
 * @property {number} servicesUsed
 * @property {number} totalActivities
 * @property {number} completedActivities
 * @property {string|null} mostUsedServiceKey
 * @property {string|null} mostUsedServiceName
 * @property {string|null} lastActiveAt
 */

/**
 * @typedef {Object} UserProfileAnalytics
 * @property {string} userId
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} email
 * @property {string|null} faculty
 * @property {string|null} major
 * @property {string|null} registeredAt
 * @property {string|null} lastActivityAt
 * @property {UserActivitySummary} summary
 * @property {RecentActivityItem[]} recentActivity
 * @property {Object<string, *>} services
 */

/**
 * @typedef {Object} MockInterviewAnalytics
 * @property {number} started
 * @property {number} completed
 * @property {number} evaluated
 * @property {number} reportsGenerated
 * @property {number} uniqueUsers
 * @property {number} averageOverallRating
 * @property {{ label: string, count: number }[]} evaluationDistribution
 * @property {{ label: string, count: number }[]} attemptDistribution
 * @property {{ questionId: string, questionTitle: string, averageRating: number, answerCount: number }[]} questionPerformance
 * @property {{ id: string, userName: string, email: string, major: string, status: string, overallRating: number|null, reportGenerated: boolean, submittedAt: string }[]} recentInterviews
 */

/**
 * @typedef {Object} SdsAnalytics
 * @property {number} started
 * @property {number} completed
 * @property {number} drafts
 * @property {number} completionRate
 * @property {number} uniqueUsers
 * @property {{ hollandCode: string, count: number }[]} resultDistribution
 * @property {{ attemptNumber: number, count: number }[]} attemptDistribution
 * @property {string|null} mostCommonHollandCode
 * @property {{ id: string, userName: string, email: string, hollandCode: string, attemptNumber: number, completedAt: string }[]} recentCompletions
 */

/**
 * @typedef {Object} JobComparisonAnalytics
 * @property {number} totalComparisons
 * @property {number} completedComparisons
 * @property {number} draftComparisons
 * @property {number} uniqueUsers
 * @property {number} completionRate
 * @property {{ jobName: string, count: number }[]} mostComparedJobs
 * @property {{ jobA: string, jobB: string, count: number }[]} topJobPairs
 * @property {{ winner: 'A'|'B'|'Tie', count: number }[]} winnerDistribution
 * @property {{ category: 'HEAD'|'HEART', jobAWins: number, jobBWins: number, ties: number }[]} headVsHeart
 * @property {{ id: string, userName: string, email: string, jobAName: string, jobBName: string, scoreA: number|null, scoreB: number|null, winner: string, status: string, createdAt: string }[]} recentComparisons
 */

/**
 * @typedef {Object} GamificationAnalytics
 * @property {number} totalPlayers
 * @property {number} gameSessions
 * @property {number} questionsAnswered
 * @property {number} correctAnswers
 * @property {number} incorrectAnswers
 * @property {number} accuracyRate
 * @property {number} averageScore
 * @property {{ levelNumber: number, levelName: string, started: number, completed: number, dropOffRate: number }[]} levelProgression
 * @property {{ ability: string, usageCount: number }[]} abilityUsage
 * @property {number} timeoutCount
 * @property {{ questionId: string, questionText: string, incorrectRate: number, timesAnswered: number }[]} hardestQuestions
 * @property {{ questionId: string, questionText: string, correctRate: number, timesAnswered: number }[]} easiestQuestions
 */

/**
 * @typedef {Object} ResumeAnalytics
 * @property {number} uploads
 * @property {number} uniqueUsers
 * @property {{ id: string, userName: string, email: string, fileName: string, uploadedAt: string }[]} recentUploads
 */

/**
 * @typedef {Object} CoverLetterAnalytics
 * @property {number} uploads
 * @property {number} uniqueUsers
 * @property {{ id: string, userName: string, email: string, fileName: string, uploadedAt: string }[]} recentUploads
 */

/**
 * @typedef {Object} ChatAnalytics
 * @property {number} totalSessions
 * @property {number} uniqueUsers
 * @property {number} totalMessages
 * @property {number} averageMessagesPerSession
 * @property {{ id: string, userName: string, email: string, messageCount: number, lastMessageAt: string }[]} recentSessions
 */

/**
 * @typedef {Object} JobMatchingAnalytics
 * @property {number} totalSearches
 * @property {number} uniqueUsers
 * @property {{ major: string, count: number }[]} topMajors
 * @property {{ country: string, count: number }[]} topCountries
 * @property {{ id: string, userName: string, email: string, major: string, country: string, resultsCount: number, searchedAt: string }[]} recentSearches
 */

export {};
