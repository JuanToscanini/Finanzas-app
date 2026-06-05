package com.finanzas.backend.group;

import com.finanzas.backend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GroupRepository extends JpaRepository<Group, Long> {

    List<Group> findByMembersContaining(User member);

    List<Group> findByMembersContainingAndIsActiveTrue(User member);

    List<Group> findByCreatedBy(User createdBy);
}
