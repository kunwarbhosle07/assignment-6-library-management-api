const { db } = require('../config/firebaseConfig');

// List books with search and category filtering
exports.getBooks = async (req, res, next) => {
  try {
    const { search, category } = req.query;

    const booksRef = db.collection('books');
    const snapshot = await booksRef.get();

    let books = [];
    snapshot.forEach((doc) => {
      books.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // In-memory filtering to avoid Firestore composite index requirement
    if (category) {
      const lowerCat = category.toLowerCase().trim();
      books = books.filter(
        (book) => book.category && book.category.toLowerCase() === lowerCat
      );
    }

    if (search) {
      const lowerSearch = search.toLowerCase().trim();
      books = books.filter((book) => {
        const titleMatch = book.title && book.title.toLowerCase().includes(lowerSearch);
        const authorMatch = book.author && book.author.toLowerCase().includes(lowerSearch);
        const isbnMatch = book.isbn && book.isbn.toLowerCase().includes(lowerSearch);
        return titleMatch || authorMatch || isbnMatch;
      });
    }

    return res.status(200).json({
      success: true,
      data: books
    });
  } catch (error) {
    next(error);
  }
};

// Get single book details
exports.getBookById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const bookDoc = await db.collection('books').doc(id).get();

    if (!bookDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Book not found.'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: bookDoc.id,
        ...bookDoc.data()
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create a new book (Librarian only)
exports.createBook = async (req, res, next) => {
  try {
    const { title, author, isbn, category, totalCopies } = req.body;

    if (!title || !author || !isbn || !category || totalCopies === undefined || totalCopies === null) {
      return res.status(400).json({
        success: false,
        message: 'Title, author, isbn, category, and totalCopies are required.'
      });
    }

    const copiesCount = parseInt(totalCopies, 10);
    if (isNaN(copiesCount) || copiesCount < 0) {
      return res.status(400).json({
        success: false,
        message: 'totalCopies must be a non-negative integer.'
      });
    }

    const cleanIsbn = isbn.trim();
    // Check if book with same ISBN exists
    const booksRef = db.collection('books');
    const isbnSnapshot = await booksRef.where('isbn', '==', cleanIsbn).get();

    if (!isbnSnapshot.empty) {
      return res.status(409).json({
        success: false,
        message: 'A book with this ISBN already exists.'
      });
    }

    const createdAt = new Date().toISOString();
    const newBook = {
      title: title.trim(),
      author: author.trim(),
      isbn: cleanIsbn,
      category: category.trim(),
      totalCopies: copiesCount,
      availableCopies: copiesCount,
      createdAt
    };

    const docRef = await booksRef.add(newBook);

    return res.status(201).json({
      success: true,
      message: 'Book created successfully.',
      data: {
        id: docRef.id,
        ...newBook
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update book details or inventory (Librarian only)
exports.updateBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, author, isbn, category, totalCopies } = req.body;

    const bookRef = db.collection('books').doc(id);
    const bookDoc = await bookRef.get();

    if (!bookDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Book not found.'
      });
    }

    const currentBook = bookDoc.data();
    const updates = {};

    if (title !== undefined) updates.title = title.trim();
    if (author !== undefined) updates.author = author.trim();
    if (category !== undefined) updates.category = category.trim();

    if (isbn !== undefined && isbn.trim() !== currentBook.isbn) {
      const cleanIsbn = isbn.trim();
      const isbnSnapshot = await db.collection('books').where('isbn', '==', cleanIsbn).get();
      if (!isbnSnapshot.empty) {
        return res.status(409).json({
          success: false,
          message: 'Another book with this ISBN already exists.'
        });
      }
      updates.isbn = cleanIsbn;
    }

    if (totalCopies !== undefined) {
      const newTotalCopies = parseInt(totalCopies, 10);
      if (isNaN(newTotalCopies) || newTotalCopies < 0) {
        return res.status(400).json({
          success: false,
          message: 'totalCopies must be a non-negative integer.'
        });
      }

      const copyDelta = newTotalCopies - currentBook.totalCopies;
      let newAvailableCopies = currentBook.availableCopies + copyDelta;

      // Ensure availableCopies is between 0 and newTotalCopies
      if (newAvailableCopies < 0) newAvailableCopies = 0;
      if (newAvailableCopies > newTotalCopies) newAvailableCopies = newTotalCopies;

      updates.totalCopies = newTotalCopies;
      updates.availableCopies = newAvailableCopies;
    }

    await bookRef.update(updates);

    const updatedDoc = await bookRef.get();

    return res.status(200).json({
      success: true,
      message: 'Book updated successfully.',
      data: {
        id: updatedDoc.id,
        ...updatedDoc.data()
      }
    });
  } catch (error) {
    next(error);
  }
};

// Delete a book (Librarian only)
exports.deleteBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const bookRef = db.collection('books').doc(id);
    const bookDoc = await bookRef.get();

    if (!bookDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Book not found.'
      });
    }

    // Reject with 400 if any active ('borrowed') records exist for it
    const activeBorrowsSnapshot = await db
      .collection('borrow_records')
      .where('bookId', '==', id)
      .get();

    const hasActiveBorrows = activeBorrowsSnapshot.docs.some(
      (doc) => doc.data().status === 'borrowed'
    );

    if (hasActiveBorrows) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete book with active borrow records.'
      });
    }

    await bookRef.delete();

    return res.status(200).json({
      success: true,
      message: 'Book deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
