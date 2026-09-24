const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const borrowController = require('../controllers/borrowController');
const auth = require('../middleware/auth');
const { verifyStudent, verifyLibrarian } = require('../middleware/checkRole');

/**
 * @swagger
 * tags:
 *   name: Books
 *   description: Book catalog CRUD, search, borrowing, and returning
 */

/**
 * @swagger
 * /api/books/my-history:
 *   get:
 *     summary: Get current student's borrow history
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of borrow records for the logged-in student
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Student access only
 *       429:
 *         description: Rate limit exceeded
 */
// NOTE: Registered BEFORE /:id to prevent Express route collision
router.get('/my-history', auth, verifyStudent, borrowController.getMyHistory);

/**
 * @swagger
 * /api/books:
 *   get:
 *     summary: List books with optional search and category filter
 *     tags: [Books]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query matching title, author, or ISBN (case-insensitive)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter books by exact category
 *     responses:
 *       200:
 *         description: Array of books matching criteria
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       429:
 *         description: Rate limit exceeded
 *   post:
 *     summary: Create a new book (Librarian only)
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookInput'
 *     responses:
 *       201:
 *         description: Book created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Librarian access only
 *       409:
 *         description: Duplicate ISBN
 *       429:
 *         description: Rate limit exceeded
 */
router.get('/', bookController.getBooks);
router.post('/', auth, verifyLibrarian, bookController.createBook);

/**
 * @swagger
 * /api/books/{id}:
 *   get:
 *     summary: Get book details by ID
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Book Document ID
 *     responses:
 *       200:
 *         description: Single book details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Book not found
 *       429:
 *         description: Rate limit exceeded
 *   put:
 *     summary: Update book details or inventory (Librarian only)
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Book Document ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookInput'
 *     responses:
 *       200:
 *         description: Book updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Librarian access only
 *       404:
 *         description: Book not found
 *       409:
 *         description: Duplicate ISBN
 *       429:
 *         description: Rate limit exceeded
 *   delete:
 *     summary: Delete a book (Librarian only)
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Book Document ID
 *     responses:
 *       200:
 *         description: Book deleted successfully
 *       400:
 *         description: Cannot delete book with active borrow records
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Librarian access only
 *       404:
 *         description: Book not found
 *       429:
 *         description: Rate limit exceeded
 */
router.get('/:id', bookController.getBookById);
router.put('/:id', auth, verifyLibrarian, bookController.updateBook);
router.delete('/:id', auth, verifyLibrarian, bookController.deleteBook);

/**
 * @swagger
 * /api/books/{id}/borrow:
 *   post:
 *     summary: Borrow a book (Student only - Atomic Transaction)
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Book Document ID
 *     responses:
 *       200:
 *         description: Book borrowed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Out of stock or already borrowed by student
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Student access only
 *       404:
 *         description: Book not found
 *       429:
 *         description: Rate limit exceeded
 */
router.post('/:id/borrow', auth, verifyStudent, borrowController.borrowBook);

/**
 * @swagger
 * /api/books/{id}/return:
 *   post:
 *     summary: Return a borrowed book (Student only - Atomic Transaction)
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Book Document ID
 *     responses:
 *       200:
 *         description: Book returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: No active borrow record found for this book
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Student access only
 *       404:
 *         description: Book not found
 *       429:
 *         description: Rate limit exceeded
 */
router.post('/:id/return', auth, verifyStudent, borrowController.returnBook);

module.exports = router;
