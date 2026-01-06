import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { BookCard } from '@/components/books/BookCard';
import { getReadingLists, getBook, getBooks, updateReadingList } from '@/services/api';
import { ReadingList, Book } from '@/types';
import { formatDate } from '@/utils/formatters';
import { handleApiError, showSuccess } from '@/utils/errorHandling';

/**
 * Reading List Detail page component
 */
export function ReadingListDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [readingList, setReadingList] = useState<ReadingList | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddBooksModalOpen, setIsAddBooksModalOpen] = useState(false);
  const [availableBooks, setAvailableBooks] = useState<Book[]>([]);
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [isAddingBooks, setIsAddingBooks] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isRemovingBook, setIsRemovingBook] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadReadingListDetail(id);
    }
  }, [id]);

  const loadReadingListDetail = async (listId: string) => {
    setIsLoading(true);
    try {
      // Get all reading lists and find the specific one
      const lists = await getReadingLists();
      const list = lists.find(l => l.id === listId);
      
      if (!list) {
        navigate('/reading-lists');
        return;
      }

      setReadingList(list);

      // Load all books in the list
      if (list.bookIds.length > 0) {
        const bookPromises = list.bookIds.map(async (bookId) => {
          try {
            return await getBook(bookId);
          } catch (error) {
            console.error(`Failed to load book ${bookId}:`, error);
            return null;
          }
        });

        const loadedBooks = await Promise.all(bookPromises);
        setBooks(loadedBooks.filter((book): book is Book => book !== null));
      }
    } catch (error) {
      handleApiError(error);
      navigate('/reading-lists');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableBooks = async () => {
    try {
      const allBooks = await getBooks();
      // Filter out books that are already in the reading list
      const booksNotInList = allBooks.filter(book => 
        !readingList?.bookIds.includes(book.id)
      );
      setAvailableBooks(booksNotInList);
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleAddBooksClick = () => {
    setIsAddBooksModalOpen(true);
    loadAvailableBooks();
  };

  const handleBookSelection = (bookId: string) => {
    setSelectedBookIds(prev => 
      prev.includes(bookId) 
        ? prev.filter(id => id !== bookId)
        : [...prev, bookId]
    );
  };

  const handleAddSelectedBooks = async () => {
    if (!readingList || selectedBookIds.length === 0) return;

    setIsAddingBooks(true);
    try {
      const updatedBookIds = [...readingList.bookIds, ...selectedBookIds];
      const updatedList = await updateReadingList(readingList.id, {
        ...readingList,
        bookIds: updatedBookIds,
        updatedAt: new Date().toISOString(),
      });

      setReadingList(updatedList);
      
      // Load the newly added books
      const newBookPromises = selectedBookIds.map(bookId => getBook(bookId));
      const newBooks = await Promise.all(newBookPromises);
      const validNewBooks = newBooks.filter((book): book is Book => book !== null);
      
      setBooks(prev => [...prev, ...validNewBooks]);
      setIsAddBooksModalOpen(false);
      setSelectedBookIds([]);
      
      showSuccess(`Added ${selectedBookIds.length} book(s) to your reading list!`);
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsAddingBooks(false);
    }
  };

  const handleRemoveBook = async (bookId: string) => {
    if (!readingList) return;

    setIsRemovingBook(bookId);
    try {
      const updatedBookIds = readingList.bookIds.filter(id => id !== bookId);
      const updatedList = await updateReadingList(readingList.id, {
        ...readingList,
        bookIds: updatedBookIds,
        updatedAt: new Date().toISOString(),
      });

      setReadingList(updatedList);
      setBooks(prev => prev.filter(book => book.id !== bookId));
      
      showSuccess('Book removed from reading list!');
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsRemovingBook(null);
    }
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!readingList) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Reading List Not Found</h2>
          <p className="text-slate-600 mb-4">The reading list you're looking for doesn't exist.</p>
          <Button variant="primary" onClick={() => navigate('/reading-lists')}>
            Back to Reading Lists
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate('/reading-lists')}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Reading Lists
            </button>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-slate-200 p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-slate-900 mb-4">{readingList.name}</h1>
                <p className="text-slate-600 text-lg leading-relaxed mb-4">{readingList.description}</p>
                
                <div className="flex items-center gap-6 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span className="font-medium">{books.length} books</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Created {formatDate(readingList.createdAt)}</span>
                  </div>
                  {readingList.updatedAt && readingList.updatedAt !== readingList.createdAt && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Updated {formatDate(readingList.updatedAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button variant="secondary" size="sm" onClick={handleAddBooksClick}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Books
                </Button>
                <Button 
                  variant={isEditMode ? "primary" : "secondary"} 
                  size="sm" 
                  onClick={toggleEditMode}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isEditMode ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    )}
                  </svg>
                  {isEditMode ? 'Done Editing' : 'Edit List'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Books Grid */}
        {books.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">
                Books in this list ({books.length})
              </h2>
              {isEditMode && (
                <div className="text-sm text-slate-600 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Click the × button on any book to remove it from this list
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {books.map((book) => (
                <div key={book.id} className="relative group">
                  <BookCard book={book} />
                  
                  {/* Remove Button in Edit Mode */}
                  {isEditMode && (
                    <button
                      onClick={() => handleRemoveBook(book.id)}
                      disabled={isRemovingBook === book.id}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all duration-200 flex items-center justify-center group-hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Remove from reading list"
                    >
                      {isRemovingBook === book.id ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200">
            <svg
              className="w-16 h-16 text-slate-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No books in this list yet</h3>
            <p className="text-slate-600 mb-4">
              Start building your reading list by adding some books
            </p>
            <Button variant="primary" onClick={handleAddBooksClick}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Your First Book
            </Button>
          </div>
        )}
      </div>

      {/* Add Books Modal */}
      <Modal
        isOpen={isAddBooksModalOpen}
        onClose={() => {
          setIsAddBooksModalOpen(false);
          setSelectedBookIds([]);
        }}
        title="Add Books to Reading List"
      >
        <div className="max-h-96 overflow-y-auto">
          {availableBooks.length > 0 ? (
            <div>
              <p className="text-sm text-slate-600 mb-4">
                Select books to add to "{readingList?.name}". Click on books to select them.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {availableBooks.map((book) => (
                  <div
                    key={book.id}
                    onClick={() => handleBookSelection(book.id)}
                    className={`
                      relative cursor-pointer rounded-lg border-2 transition-all duration-200 p-3
                      ${selectedBookIds.includes(book.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                      }
                    `}
                  >
                    {/* Selection Indicator */}
                    <div className={`
                      absolute top-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center
                      ${selectedBookIds.includes(book.id)
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-slate-300'
                      }
                    `}>
                      {selectedBookIds.includes(book.id) && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <img
                        src={book.coverImage}
                        alt={book.title}
                        className="w-12 h-16 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/48x64?text=No+Cover';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-slate-900 truncate">{book.title}</h4>
                        <p className="text-xs text-slate-600 truncate">by {book.author}</p>
                        <p className="text-xs text-slate-500 mt-1">{book.genre}</p>
                        <div className="flex items-center mt-1">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-3 h-3 ${
                                  i < Math.floor(book.rating) ? 'text-yellow-400' : 'text-slate-300'
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                            <span className="text-xs text-slate-500 ml-1">{book.rating}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedBookIds.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>{selectedBookIds.length}</strong> book(s) selected
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="primary"
                  onClick={handleAddSelectedBooks}
                  disabled={selectedBookIds.length === 0 || isAddingBooks}
                  className="flex-1"
                >
                  {isAddingBooks ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Adding Books...
                    </>
                  ) : (
                    `Add ${selectedBookIds.length} Book(s)`
                  )}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsAddBooksModalOpen(false);
                    setSelectedBookIds([]);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <svg
                className="w-12 h-12 text-slate-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">All books are already in this list</h3>
              <p className="text-slate-600 mb-4">
                You've added all available books to this reading list.
              </p>
              <Button
                variant="secondary"
                onClick={() => setIsAddBooksModalOpen(false)}
              >
                Close
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}