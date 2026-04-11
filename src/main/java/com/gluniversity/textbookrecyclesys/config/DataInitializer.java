package com.gluniversity.textbookrecyclesys.config;

import com.gluniversity.textbookrecyclesys.entity.*;
import com.gluniversity.textbookrecyclesys.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final PrizeRepository prizeRepository;
    private final PointsRuleRepository pointsRuleRepository;

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            User student = new User();
            student.setUsername("202431100122");
            student.setPassword("123456");
            student.setRole("STUDENT");
            student.setName("李华");
            student.setCollege("信息科学与技术学院");
            student.setMajor("计算机科学与技术");
            student.setClassName("2201班");
            student.setYear("2022年");
            student.setPhone("138****5678");
            student.setPoints(200);
            student.setCreateTime(LocalDateTime.now());
            userRepository.save(student);

            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword("123456");
            admin.setRole("ADMIN");
            admin.setName("张老师");
            admin.setEmpId("A2024001");
            admin.setDept("教材管理中心");
            admin.setPosition("系统管理员");
            admin.setYear("2020年");
            admin.setPhone("138****1234");
            admin.setWorkplace("行政楼A座305室");
            admin.setCreateTime(LocalDateTime.now());
            userRepository.save(admin);

            User logistics = new User();
            logistics.setUsername("logistics");
            logistics.setPassword("123456");
            logistics.setRole("LOGISTICS");
            logistics.setName("王师傅");
            logistics.setEmpId("B2018012");
            logistics.setDept("后勤服务中心");
            logistics.setPosition("奖品发放员");
            logistics.setYear("2018年");
            logistics.setPhone("159****5678");
            logistics.setWorkplace("后勤中心3号窗口");
            logistics.setCreateTime(LocalDateTime.now());
            userRepository.save(logistics);
        }

        if (categoryRepository.count() == 0) {
            String[] majors = {"计算机", "经管", "外语", "数学", "电子工程"};
            for (int i = 0; i < majors.length; i++) {
                Category c = new Category();
                c.setName(majors[i]);
                c.setCode(majors[i]);
                c.setSort(i + 1);
                c.setStatus("ACTIVE");
                categoryRepository.save(c);
            }
        }

        if (prizeRepository.count() == 0) {
            Prize p1 = new Prize();
            p1.setName("甜点券");
            p1.setPoints(120);
            p1.setStock(30);
            p1.setCreateTime(LocalDateTime.now());
            prizeRepository.save(p1);

            Prize p2 = new Prize();
            p2.setName("笔记本套装");
            p2.setPoints(50);
            p2.setStock(50);
            p2.setCreateTime(LocalDateTime.now());
            prizeRepository.save(p2);

            Prize p3 = new Prize();
            p3.setName("帆布袋");
            p3.setPoints(80);
            p3.setStock(40);
            p3.setCreateTime(LocalDateTime.now());
            prizeRepository.save(p3);

            Prize p4 = new Prize();
            p4.setName("文具礼包");
            p4.setPoints(40);
            p4.setStock(60);
            p4.setCreateTime(LocalDateTime.now());
            prizeRepository.save(p4);

            Prize p5 = new Prize();
            p5.setName("咖啡券");
            p5.setPoints(30);
            p5.setStock(100);
            p5.setCreateTime(LocalDateTime.now());
            prizeRepository.save(p5);
        }

        if (pointsRuleRepository.count() == 0) {
            PointsRule rule = new PointsRule();
            rule.setRuleNew(200);
            rule.setRuleGood(150);
            rule.setRuleNormal(80);
            rule.setRuleOld(40);
            rule.setPrizeMax(500);
            pointsRuleRepository.save(rule);
        }
    }
}
