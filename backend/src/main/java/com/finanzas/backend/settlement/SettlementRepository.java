package com.finanzas.backend.settlement;

import com.finanzas.backend.group.Group;
import com.finanzas.backend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SettlementRepository extends JpaRepository<Settlement, Long> {

    List<Settlement> findByGroup(Group group);

    List<Settlement> findByGroupAndStatus(Group group, Settlement.Status status);

    List<Settlement> findByPaidByOrPaidTo(User paidBy, User paidTo);
}
