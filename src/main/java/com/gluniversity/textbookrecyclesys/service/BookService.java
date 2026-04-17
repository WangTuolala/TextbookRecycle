package com.gluniversity.textbookrecyclesys.service;

import com.gluniversity.textbookrecyclesys.entity.Book;
import com.gluniversity.textbookrecyclesys.entity.BookExchange;
import com.gluniversity.textbookrecyclesys.entity.PointsRecord;
import com.gluniversity.textbookrecyclesys.repository.BookExchangeRepository;
import com.gluniversity.textbookrecyclesys.repository.BookRepository;
import com.gluniversity.textbookrecyclesys.repository.PointsRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BookService {
    private final BookRepository bookRepository;
    private final BookExchangeRepository bookExchangeRepository;
    private final PointsRecordRepository pointsRecordRepository;

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    public String saveCoverImage(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) return null;
        String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        Path filePath = uploadPath.resolve(filename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        return "/" + uploadDir + "/" + filename;
    }

    public List<Book> getAllBooks() {
        return bookRepository.findAll();
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

    public Book addBookWithImage(Book book, MultipartFile coverImageFile) throws IOException {
        if (coverImageFile != null && !coverImageFile.isEmpty()) {
            book.setCoverImage(saveCoverImage(coverImageFile));
        }
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

    public Book updateBookStatus(Long id, String status) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("书籍不存在"));
        book.setStatus(status);
        book.setUpdateTime(LocalDateTime.now());
        return bookRepository.save(book);
    }

    public Book updateBookWithImage(Long id, Book updatedBook, MultipartFile coverImageFile) throws IOException {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("书籍不存在"));
        book.setName(updatedBook.getName());
        book.setAuthor(updatedBook.getAuthor());
        book.setPublisher(updatedBook.getPublisher());
        book.setIsbn(updatedBook.getIsbn());
        book.setMajor(updatedBook.getMajor());
        book.setPoints(updatedBook.getPoints());
        book.setStock(updatedBook.getStock());
        book.setCondition(updatedBook.getCondition());
        book.setStatus(updatedBook.getStatus());
        if (coverImageFile != null && !coverImageFile.isEmpty()) {
            book.setCoverImage(saveCoverImage(coverImageFile));
        }
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

    @Transactional
    public Book exchangeBook(Long studentId, Long bookId, Integer quantity, UserService userService) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("书籍不存在或已下架"));
        
        if (!"LISTED".equals(book.getStatus())) {
            throw new RuntimeException("书籍已下架");
        }
        
        if (book.getStock() < quantity) {
            throw new RuntimeException("库存不足");
        }
        
        Integer userPoints = userService.getPoints(studentId);
        int totalCost = book.getPoints() * quantity;
        
        if (userPoints < totalCost) {
            throw new RuntimeException("积分不足");
        }
        
        userService.deductPoints(studentId, totalCost, "EXCHANGE", book.getName(), "BOOK");

        book.setStock(book.getStock() - quantity);
        book.setUpdateTime(LocalDateTime.now());
        bookRepository.save(book);

        // 记录书籍兑换
        String studentName = userService.findById(studentId)
                .map(u -> u.getName())
                .orElse("未知学生");
        BookExchange exchange = new BookExchange();
        exchange.setStudentId(studentId);
        exchange.setStudentName(studentName);
        exchange.setBookId(bookId);
        exchange.setBookName(book.getName());
        exchange.setQuantity(quantity);
        exchange.setPointsCost(totalCost);
        exchange.setExchangeTime(LocalDateTime.now());
        bookExchangeRepository.save(exchange);
        
        return book;
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
