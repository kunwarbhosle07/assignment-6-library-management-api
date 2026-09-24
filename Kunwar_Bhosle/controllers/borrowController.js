const { db } = require('../config/firebaseConfig');

// Borrow a book (Student only - Firestore Transaction)
exports.borrowBook = async (req, res, next) => {
  try {
    const { id: bookId } = req.params;
    const userId = req.user.id;

    const bookRef = db.collection('books').doc(bookId);

    const resultRecord = await db.runTransaction(async (transaction) => {
      // 1. Read book document
      const bookDoc = await transaction.get(bookRef);
      if (!bookDoc.exists) {
        const error = new Error('Book not found.');
        error.statusCode = 404;
        throw error;
      }

      const bookData = bookDoc.data();

      // 2. Validate availability
      if (bookData.availableCopies <= 0) {
        const error = new Error('No available copies for this book.');
        error.statusCode = 400;
        throw error;
      }

      // 3. Check for existing active borrow record for the same book by this student
      const userBorrowsQuery = db
        .collection('borrow_records')
        .where('userId', '==', userId);
      const userBorrowsSnapshot = await transaction.get(userBorrowsQuery);

      const hasActiveBorrow = userBorrowsSnapshot.docs.some(
        (doc) => doc.data().bookId === bookId && doc.data().status === 'borrowed'
      );

      if (hasActiveBorrow) {
        const error = new Error('You already have an active borrow record for this book.');
        error.statusCode = 400;
        throw error;
      }

      // 4. Create new borrow record and update book available copies
      const borrowRef = db.collection('borrow_records').doc();
      const borrowDateObj = new Date();
      const dueDateObj = new Date(borrowDateObj.getTime() + 14 * 24 * 60 * 60 * 1000); // +14 days

      const borrowRecordData = {
        userId,
        bookId,
        bookTitle: bookData.title,
        borrowDate: borrowDateObj.toISOString(),
        dueDate: dueDateObj.toISOString(),
        returnDate: null,
        status: 'borrowed'
      };

      transaction.update(bookRef, {
        availableCopies: bookData.availableCopies - 1
      });

      transaction.set(borrowRef, borrowRecordData);

      return {
        id: borrowRef.id,
        ...borrowRecordData
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Book borrowed successfully.',
      data: resultRecord
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

// Return a borrowed book (Student only - Firestore Transaction)
exports.returnBook = async (req, res, next) => {
  try {
    const { id: bookId } = req.params;
    const userId = req.user.id;

    const bookRef = db.collection('books').doc(bookId);

    const resultRecord = await db.runTransaction(async (transaction) => {
      // 1. Read book document
      const bookDoc = await transaction.get(bookRef);
      if (!bookDoc.exists) {
        const error = new Error('Book not found.');
        error.statusCode = 404;
        throw error;
      }

      const bookData = bookDoc.data();

      // 2. Find active borrow record for this student and book
      const userBorrowsQuery = db
        .collection('borrow_records')
        .where('userId', '==', userId);
      const userBorrowsSnapshot = await transaction.get(userBorrowsQuery);

      const activeRecordDoc = userBorrowsSnapshot.docs.find(
        (doc) => doc.data().bookId === bookId && doc.data().status === 'borrowed'
      );

      if (!activeRecordDoc) {
        const error = new Error('No active borrow record found for this book.');
        error.statusCode = 400;
        throw error;
      }

      const returnDate = new Date().toISOString();

      // Ensure availableCopies does not exceed totalCopies
      const newAvailableCopies = Math.min(
        bookData.totalCopies,
        bookData.availableCopies + 1
      );

      transaction.update(bookRef, { availableCopies: newAvailableCopies });
      transaction.update(activeRecordDoc.ref, {
        returnDate,
        status: 'returned'
      });

      return {
        id: activeRecordDoc.id,
        ...activeRecordDoc.data(),
        returnDate,
        status: 'returned'
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Book returned successfully.',
      data: resultRecord
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

// Get current student's borrow history (Student only)
exports.getMyHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const snapshot = await db
      .collection('borrow_records')
      .where('userId', '==', userId)
      .get();

    const records = [];
    snapshot.forEach((doc) => {
      records.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Sort by borrowDate descending
    records.sort((a, b) => new Date(b.borrowDate) - new Date(a.borrowDate));

    return res.status(200).json({
      success: true,
      data: records
    });
  } catch (error) {
    next(error);
  }
};

// Get all borrow records (Librarian only)
exports.getAllBorrowRecords = async (req, res, next) => {
  try {
    const snapshot = await db.collection('borrow_records').get();

    const records = [];
    snapshot.forEach((doc) => {
      records.push({
        id: doc.id,
        ...doc.data()
      });
    });

    records.sort((a, b) => new Date(b.borrowDate) - new Date(a.borrowDate));

    return res.status(200).json({
      success: true,
      data: records
    });
  } catch (error) {
    next(error);
  }
};

// Get overdue borrow reports (Librarian only)
exports.getOverdueReports = async (req, res, next) => {
  try {
    const snapshot = await db
      .collection('borrow_records')
      .where('status', '==', 'borrowed')
      .get();

    const now = new Date();
    const overdueRecords = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.dueDate && new Date(data.dueDate) < now) {
        overdueRecords.push({
          id: doc.id,
          ...data
        });
      }
    });

    return res.status(200).json({
      success: true,
      data: overdueRecords
    });
  } catch (error) {
    next(error);
  }
};
