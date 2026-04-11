package com.gluniversity.textbookrecyclesys.service;

import com.gluniversity.textbookrecyclesys.entity.Book;
import com.gluniversity.textbookrecyclesys.repository.BookRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BookService {
    private final BookRepository bookRepository;

    public List<Book> getAllBooks() {
        return bookRepository.findByStatus("LISTED");
    }

    public List<Book> getBooksByMajor(String major) {
        return bookRepository.findByStatusAndMajor("LISTED", major);
    }

    public Optional<Book> getBookById(Long id) {
        return bookRepository.findById(id);
    }

    public Book addBook(Book book) {
        book.setStatus("LISTED");
        book.setCreateTime(LocalDateTime.now());
        book.setUpdateTime(LocalDateTime.now());
        return bookRepository.save(book);
    }

    public Book updateBook(Long id, Book updatedBook) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("书籍不存在"));
        book.setName(updatedBook.getName());
        book.setAuthor(updatedBook.getAuthor());
        book.setPublisher(updatedBook.getPublisher());
        book.setIsbn(updatedBook.getIsbn());
        book.setMajor(updatedBook.getMajor());
        book.setPoints(updatedBook.getPoints());
        book.setStock(updatedBook.getStock());
        book.setCoverImage(updatedBook.getCoverImage());
        book.setUpdateTime(LocalDateTime.now());
        return bookRepository.save(book);
    }

    public void deleteBook(Long id) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("书籍不存在"));
        book.setStatus("DELISTED");
        bookRepository.save(book);
    }

    public void updateStock(Long id, Integer change) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("书籍不存在"));
        int newStock = book.getStock() + change;
        if (newStock < 0) {
            throw new RuntimeException("库存不足");
        }
        book.setStock(newStock);
        book.setUpdateTime(LocalDateTime.now());
        bookRepository.save(book);
    }

    public List<Book> searchBooks(String keyword) {
        List<Book> allBooks = bookRepository.findAll();
        if (keyword == null || keyword.trim().isEmpty()) {
            return allBooks.stream().filter(b -> "LISTED".equals(b.getStatus())).toList();
        }
        String kw = keyword.toLowerCase();
        return allBooks.stream()
                .filter(b -> "LISTED".equals(b.getStatus()))
                .filter(b -> b.getName().toLowerCase().contains(kw)
                        || (b.getIsbn() != null && b.getIsbn().toLowerCase().contains(kw))
                        || (b.getAuthor() != null && b.getAuthor().toLowerCase().contains(kw)))
                .toList();
    }
}
