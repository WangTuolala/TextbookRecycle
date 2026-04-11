package com.gluniversity.textbookrecyclesys.service;

import com.gluniversity.textbookrecyclesys.entity.*;
import com.gluniversity.textbookrecyclesys.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InventoryService {
    private final BookRepository bookRepository;
    private final InventoryRecordRepository recordRepository;
    private final PrizeRepository prizeRepository;

    public List<Book> getLowStockBooks() {
        return bookRepository.findByStatus("LISTED").stream()
                .filter(b -> b.getStock() <= 5)
                .toList();
    }

    @Transactional
    public void bookIn(Long bookId, Integer quantity, String operator, String remark) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("书籍不存在"));
        book.setStock(book.getStock() + quantity);
        bookRepository.save(book);

        InventoryRecord record = new InventoryRecord();
        record.setBookId(bookId);
        record.setBookName(book.getName());
        record.setType("IN");
        record.setQuantity(quantity);
        record.setOperator(operator);
        record.setRemark(remark);
        record.setCreateTime(LocalDateTime.now());
        recordRepository.save(record);
    }

    @Transactional
    public void bookOut(Long bookId, Integer quantity, String operator, String remark) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("书籍不存在"));
        if (book.getStock() < quantity) {
            throw new RuntimeException("库存不足");
        }
        book.setStock(book.getStock() - quantity);
        bookRepository.save(book);

        InventoryRecord record = new InventoryRecord();
        record.setBookId(bookId);
        record.setBookName(book.getName());
        record.setType("OUT");
        record.setQuantity(quantity);
        record.setOperator(operator);
        record.setRemark(remark);
        record.setCreateTime(LocalDateTime.now());
        recordRepository.save(record);
    }

    public List<InventoryRecord> getRecordsByBook(Long bookId) {
        return recordRepository.findByBookIdOrderByCreateTimeDesc(bookId);
    }

    public List<InventoryRecord> getAllRecords() {
        return recordRepository.findAll();
    }

    public List<Book> getAllBooksForInventory() {
        return bookRepository.findAll().stream()
                .filter(b -> !"DELISTED".equals(b.getStatus()))
                .toList();
    }
}
