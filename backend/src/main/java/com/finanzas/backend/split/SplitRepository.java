package com.finanzas.backend.split;

import com.finanzas.backend.expense.Expense;
import com.finanzas.backend.group.Group;
import com.finanzas.backend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SplitRepository extends JpaRepository<Split, Long> {

    List<Split> findByExpense(Expense expense);

    List<Split> findByUser(User user);

    List<Split> findByUserAndIsSettledFalse(User user);

    List<Split> findByExpense_Group(Group group);
}
