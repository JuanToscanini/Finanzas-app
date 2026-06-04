package com.finanzas.backend.user;

import com.finanzas.backend.user.dto.FriendshipResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/friendships")
@RequiredArgsConstructor
public class FriendshipController {

    private final FriendshipService friendshipService;

    @PostMapping("/request/{addresseeId}")
    public ResponseEntity<FriendshipResponse> sendRequest(
            @PathVariable Long addresseeId,
            @RequestHeader("X-User-Id") Long userId) {
        Friendship friendship = friendshipService.sendFriendRequest(userId, addresseeId);
        return ResponseEntity.status(HttpStatus.CREATED).body(FriendshipResponse.from(friendship));
    }

    @PutMapping("/{id}/accept")
    public ResponseEntity<FriendshipResponse> accept(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId) {
        Friendship friendship = friendshipService.acceptFriendRequest(id, userId);
        return ResponseEntity.ok(FriendshipResponse.from(friendship));
    }

    @DeleteMapping("/{id}/reject")
    public ResponseEntity<Void> reject(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId) {
        friendshipService.rejectFriendRequest(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/block")
    public ResponseEntity<FriendshipResponse> block(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId) {
        Friendship friendship = friendshipService.blockUser(id, userId);
        return ResponseEntity.ok(FriendshipResponse.from(friendship));
    }

    @GetMapping("/friends")
    public ResponseEntity<List<FriendshipResponse>> getFriends(@RequestHeader("X-User-Id") Long userId) {
        List<FriendshipResponse> friends = friendshipService.getFriends(userId)
                .stream().map(FriendshipResponse::from).toList();
        return ResponseEntity.ok(friends);
    }

    @GetMapping("/pending")
    public ResponseEntity<List<FriendshipResponse>> getPending(@RequestHeader("X-User-Id") Long userId) {
        List<FriendshipResponse> pending = friendshipService.getPendingRequests(userId)
                .stream().map(FriendshipResponse::from).toList();
        return ResponseEntity.ok(pending);
    }
}
