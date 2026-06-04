package com.finanzas.backend.expense;

import com.finanzas.backend.category.Category;
import com.finanzas.backend.group.Group;
import com.finanzas.backend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findByGroup(Group group);

    List<Expense> findByPaidBy(User user);

    List<Expense> findByGroupAndPaidBy(Group group, User paidBy);

    List<Expense> findByGroupOrderByDateDesc(Group group);

    List<Expense> findByPaidByAndDateBetween(User user, LocalDate from, LocalDate to);

    List<Expense> findByCategory(Category category);
}
