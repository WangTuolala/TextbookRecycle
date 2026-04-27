package com.gluniversity.textbookrecyclesys.service;

import com.gluniversity.textbookrecyclesys.entity.*;
import com.gluniversity.textbookrecyclesys.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class InventoryService {
    private final BookRepository bookRepository;
    private final InventoryRecordRepository recordRepository;
    private final PrizeRepository prizeRepository;

    public List<Book> getLowStockBooks() {
        return bookRepository.findByStatus("LISTED").stream()
                .filter(b -> b.getStock() <= 10)
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
        record.setIsbn(book.getIsbn());
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
        record.setIsbn(book.getIsbn());
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

    public List<Map<String, Object>> getBooksWithOperator() {
        List<Book> books = getAllBooksForInventory();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Book book : books) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", book.getId());
            map.put("name", book.getName());
            map.put("isbn", book.getIsbn());
            map.put("stock", book.getStock());
            map.put("updateTime", book.getUpdateTime());

            // 找该书最新一条记录
            List<InventoryRecord> records = recordRepository.findByBookIdOrderByCreateTimeDesc(book.getId());
            if (!records.isEmpty()) {
                InventoryRecord last = records.get(0);
                // 自动操作（评估上架）operator 为"系统"或备注含"评估上架"，经手人显示为-
                if ("系统".equals(last.getOperator()) ||
                    (last.getRemark() != null && last.getRemark().contains("评估上架"))) {
                    map.put("lastOperator", "-");
                    map.put("operatorType", "auto");
                } else {
                    map.put("lastOperator", last.getOperator());
                    map.put("operatorType", "manual");
                }
                map.put("lastRecordTime", last.getCreateTime());
            } else {
                map.put("lastOperator", "-");
                map.put("operatorType", "none");
                map.put("lastRecordTime", null);
            }
            result.add(map);
        }
        return result;
    }

    // 返回所有进出库记录（供全部库存页面使用）
    public List<Map<String, Object>> getAllRecordsDetailed() {
        List<InventoryRecord> records = recordRepository.findAllByOrderByCreateTimeDesc();
        List<Map<String, Object>> result = new ArrayList<>();
        for (InventoryRecord r : records) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", r.getId());
            map.put("bookId", r.getBookId());
            map.put("bookName", r.getBookName());
            map.put("type", r.getType()); // IN 或 OUT
            map.put("quantity", r.getQuantity());
            map.put("time", r.getCreateTime());
            // 自动操作（评估上架/学生兑换）经手人显示为-
            if ("系统".equals(r.getOperator()) ||
                (r.getRemark() != null && (r.getRemark().contains("评估上架") || r.getRemark().contains("学生兑换")))) {
                map.put("operator", "-");
            } else {
                map.put("operator", r.getOperator() != null ? r.getOperator() : "-");
            }
            // 附带书籍 ISBN
            bookRepository.findById(r.getBookId()).ifPresent(b -> {
                map.put("isbn", b.getIsbn() != null ? b.getIsbn() : "-");
                if (map.get("bookName") == null) {
                    map.put("bookName", b.getName());
                }
            });
            result.add(map);
        }
        return result;
    }

    // 按书名+ISBN聚合，返回每本书的当前库存、最新操作时间和经手人
    public List<Map<String, Object>> getAggregatedInventory() {
        List<Book> books = bookRepository.findAll().stream()
                .filter(b -> !"DELISTED".equals(b.getStatus()))
                .toList();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Book book : books) {
            List<InventoryRecord> records = recordRepository
                    .findByBookIdOrderByCreateTimeDesc(book.getId());
            String lastOperator = "-";
            LocalDateTime lastTime = null;
            for (InventoryRecord r : records) {
                String op = r.getOperator();
                if (op != null && !"系统".equals(op) &&
                    (r.getRemark() == null || (!r.getRemark().contains("评估上架") && !r.getRemark().contains("学生兑换")))) {
                    lastOperator = op;
                    lastTime = r.getCreateTime();
                    break;
                }
                if (lastTime == null) {
                    lastTime = r.getCreateTime();
                }
            }
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("bookId", book.getId());
            map.put("bookName", book.getName());
            map.put("isbn", book.getIsbn() != null ? book.getIsbn() : "-");
            map.put("totalStock", book.getStock());
            map.put("lastOperator", lastOperator);
            map.put("lastTime", lastTime);
            result.add(map);
        }
        // 按最后操作时间倒序（最新的在前面）
        result.sort((a, b) -> {
            LocalDateTime ta = (LocalDateTime) a.get("lastTime");
            LocalDateTime tb = (LocalDateTime) b.get("lastTime");
            if (ta == null && tb == null) return 0;
            if (ta == null) return 1;
            if (tb == null) return -1;
            return tb.compareTo(ta);
        });
        return result;
    }
}
