package com.finanzas.backend.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FriendshipRepository extends JpaRepository<Friendship, Long> {

    List<Friendship> findByRequesterOrAddressee(User requester, User addressee);

    Optional<Friendship> findByRequesterAndAddressee(User requester, User addressee);

    List<Friendship> findByAddresseeAndStatus(User addressee, Friendship.Status status);

    List<Friendship> findByRequesterAndStatus(User requester, Friendship.Status status);

    boolean existsByRequesterAndAddressee(User requester, User addressee);

    boolean existsByRequesterAndAddresseeAndStatus(User requester, User addressee, Friendship.Status status);

    @Query("SELECT f FROM Friendship f WHERE (f.requester = :user OR f.addressee = :user) AND f.status = :status")
    List<Friendship> findByUserAndStatus(@Param("user") User user, @Param("status") Friendship.Status status);
}
