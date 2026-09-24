const express = require('express');
const router = express.Router();
const borrowController = require('../controllers/borrowController');
const auth = require('../middleware/auth');
const { verifyLibrarian } = require('../middleware/checkRole');

/**
 * @swagger
 * tags:
 *   name: Reports & Management
 *   description: Librarian reporting and borrow record administration
 */

/**
 * @swagger
 * /api/librarian/borrow-records:
 *   get:
 *     summary: View all active and past borrow records (Librarian only)
 *     tags: [Reports & Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all borrow records in the system
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Librarian access only
 *       429:
 *         description: Rate limit exceeded
 */
router.get('/librarian/borrow-records', auth, verifyLibrarian, borrowController.getAllBorrowRecords);

/**
 * @swagger
 * /api/reports/overdue:
 *   get:
 *     summary: Get all overdue unreturned borrow records (Librarian only)
 *     tags: [Reports & Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of overdue borrow records (status = borrowed and dueDate < current time)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Librarian access only
 *       429:
 *         description: Rate limit exceeded
 */
router.get('/reports/overdue', auth, verifyLibrarian, borrowController.getOverdueReports);

module.exports = router;
