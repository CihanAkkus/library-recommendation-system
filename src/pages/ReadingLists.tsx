import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { getReadingLists, createReadingList, deleteReadingList, getBook } from '@/services/api';
import { ReadingList, Book } from '@/types';
import { formatDate } from '@/utils/formatters';
import { handleApiError, showSuccess } from '@/utils/errorHandling';

/**
 * ReadingLists page component
 */
export function ReadingLists() {
  const navigate = useNavigate();
  const [lists, setLists] = useState<ReadingList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [booksInLists, setBooksInLists] = useState<Record<string, Book[]>>({});
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    listId: string;
    listName: string;
  }>({
    isOpen: false,
    listId: '',
    listName: '',
  });

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with DynamoDB query
      const data = await getReadingLists();
      setLists(data);
      
      // Load books for each list
      const booksData: Record<string, Book[]> = {};
      for (const list of data) {
        if (list.bookIds.length > 0) {
          const books = await Promise.all(
            list.bookIds.map(async (bookId) => {
              try {
                return await getBook(bookId);
              } catch (error) {
                console.error(`Failed to load book ${bookId}:`, error);
                return null;
              }
            })
          );
          booksData[list.id] = books.filter((book): book is Book => book !== null);
        } else {
          booksData[list.id] = [];
        }
      }
      setBooksInLists(booksData);
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      return;
    }

    try {
      // TODO: Replace with DynamoDB put operation
      const newList = await createReadingList({
        userId: '1', // TODO: Get from auth context
        name: newListName,
        description: newListDescription,
        bookIds: [],
      });
      setLists([...lists, newList]);
      setIsModalOpen(false);
      setNewListName('');
      setNewListDescription('');
      showSuccess('Reading list created successfully!');
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleDeleteClick = (list: ReadingList) => {
    setDeleteConfirmModal({
      isOpen: true,
      listId: list.id,
      listName: list.name,
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteReadingList(deleteConfirmModal.listId);
      setLists(lists.filter(list => list.id !== deleteConfirmModal.listId));
      setDeleteConfirmModal({ isOpen: false, listId: '', listName: '' });
      showSuccess('Reading list deleted successfully!');
    } catch (error) {
      handleApiError(error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">My Reading Lists</h1>
            <p className="text-slate-600 text-lg">Organize your books into custom lists</p>
          </div>
          <Button variant="primary" size="lg" onClick={() => setIsModalOpen(true)}>
            Create New List
          </Button>
        </div>

        {lists.length === 0 ? (
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No reading lists yet</h3>
            <p className="text-slate-600 mb-4">
              Create your first list to start organizing your books
            </p>
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
              Create Your First List
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {lists.map((list) => {
              const listBooks = booksInLists[list.id] || [];
              // Calculate dynamic height based on number of books
              const bookCount = listBooks.length;
              const previewHeight = Math.max(120, Math.min(200, 120 + Math.ceil(bookCount / 2) * 20));
              
              return (
                <div
                  key={list.id}
                  className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-slate-200 p-10 hover:shadow-2xl hover:border-blue-300 transition-all duration-300 cursor-pointer relative group"
                  style={{ minHeight: `${280 + (bookCount > 6 ? (Math.ceil(bookCount / 2) - 3) * 25 : 0)}px` }}
                >
                  {/* Top Right Controls */}
                  <div className="absolute top-8 right-8 flex items-center gap-3">
                    {/* Book Count Badge */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold">
                      {list.bookIds.length} {list.bookIds.length === 1 ? 'book' : 'books'}
                    </div>
                    
                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(list);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-3 rounded-full bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 shadow-sm"
                      title="Delete reading list"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="pr-24 mb-8">
                    <h3 className="text-3xl font-bold text-slate-900 mb-4 leading-tight">{list.name}</h3>
                    <p className="text-slate-600 text-lg leading-relaxed line-clamp-3">{list.description}</p>
                  </div>
                  
                  <div className="absolute bottom-8 left-10 right-10">
                    <div className="flex items-end justify-between">
                      {/* Books Preview */}
                      <div className="flex-1 mr-6">
                        {listBooks.length > 0 ? (
                          <div className="relative">
                            {/* Default view - show first few book titles */}
                            <div className="group-hover:opacity-0 transition-opacity duration-200">
                              <div className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">Books Preview</div>
                              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200" style={{ minHeight: '80px' }}>
                                <div className="text-sm text-slate-700 line-clamp-3">
                                  {listBooks.slice(0, 4).map(book => book.title).join(', ')}
                                  {listBooks.length > 4 && ` +${listBooks.length - 4} more`}
                                </div>
                              </div>
                            </div>
                            
                            {/* Hover view - show all book titles in 2 columns */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <div className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">All Books</div>
                              <div 
                                className="bg-white rounded-xl p-4 shadow-lg border border-slate-300 overflow-y-auto"
                                style={{ height: `${previewHeight}px` }}
                              >
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                  {listBooks.map((book, index) => (
                                    <div key={book.id} className="flex items-start text-slate-700">
                                      <span className="text-slate-400 text-xs mr-2 mt-0.5 flex-shrink-0">{index + 1}.</span>
                                      <span className="break-words leading-tight">{book.title}</span>
                                    </div>
                                  ))}
                                  {listBooks.length === 0 && (
                                    <div className="col-span-2 text-slate-400 italic text-center py-4">
                                      No books added yet
                                    </div>
                                  )}
                                </div>
                                {listBooks.length > 20 && (
                                  <div className="text-xs text-slate-400 text-center mt-3 border-t border-slate-200 pt-2">
                                    Scroll to see all {listBooks.length} books
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">Books Preview</div>
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200" style={{ minHeight: '80px' }}>
                              <div className="text-sm text-slate-400 italic text-center flex items-center justify-center h-full">
                                No books added yet
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Created Date and View Details */}
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/reading-lists/${list.id}`);
                          }}
                          className="text-sm text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors"
                        >
                          View Details →
                        </button>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="whitespace-nowrap">{formatDate(list.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create New Reading List"
        >
          <div>
            <Input
              label="List Name"
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="e.g., Summer Reading 2024"
              required
            />

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                value={newListDescription}
                onChange={(e) => setNewListDescription(e.target.value)}
                placeholder="What's this list about?"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px] resize-none"
              />
            </div>

            <div className="flex gap-3">
              <Button variant="primary" onClick={handleCreateList} className="flex-1">
                Create List
              </Button>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={deleteConfirmModal.isOpen}
          onClose={() => setDeleteConfirmModal({ isOpen: false, listId: '', listName: '' })}
          title="Delete Reading List"
        >
          <div>
            <div className="mb-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <p className="text-center text-slate-700">
                Are you sure you want to delete <strong>"{deleteConfirmModal.listName}"</strong>?
              </p>
              <p className="text-center text-sm text-slate-500 mt-2">
                This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="secondary" 
                onClick={() => setDeleteConfirmModal({ isOpen: false, listId: '', listName: '' })} 
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={handleDeleteConfirm} 
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
