package com.finanzas.backend.user;

import com.finanzas.backend.auth.CurrentUser;
import com.finanzas.backend.auth.UserPrincipal;
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
            @CurrentUser UserPrincipal currentUser) {
        Friendship friendship = friendshipService.sendFriendRequest(currentUser.getId(), addresseeId);
        return ResponseEntity.status(HttpStatus.CREATED).body(FriendshipResponse.from(friendship));
    }

    @PutMapping("/{id}/accept")
    public ResponseEntity<FriendshipResponse> accept(
            @PathVariable Long id,
            @CurrentUser UserPrincipal currentUser) {
        Friendship friendship = friendshipService.acceptFriendRequest(id, currentUser.getId());
        return ResponseEntity.ok(FriendshipResponse.from(friendship));
    }

    @DeleteMapping("/{id}/reject")
    public ResponseEntity<Void> reject(
            @PathVariable Long id,
            @CurrentUser UserPrincipal currentUser) {
        friendshipService.rejectFriendRequest(id, currentUser.getId());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/block")
    public ResponseEntity<FriendshipResponse> block(
            @PathVariable Long id,
            @CurrentUser UserPrincipal currentUser) {
        Friendship friendship = friendshipService.blockUser(id, currentUser.getId());
        return ResponseEntity.ok(FriendshipResponse.from(friendship));
    }

    @GetMapping("/friends")
    public ResponseEntity<List<FriendshipResponse>> getFriends(@CurrentUser UserPrincipal currentUser) {
        List<FriendshipResponse> friends = friendshipService.getFriends(currentUser.getId())
                .stream().map(FriendshipResponse::from).toList();
        return ResponseEntity.ok(friends);
    }

    @GetMapping("/pending")
    public ResponseEntity<List<FriendshipResponse>> getPending(@CurrentUser UserPrincipal currentUser) {
        List<FriendshipResponse> pending = friendshipService.getPendingRequests(currentUser.getId())
                .stream().map(FriendshipResponse::from).toList();
        return ResponseEntity.ok(pending);
    }

    @GetMapping("/sent")
    public ResponseEntity<List<FriendshipResponse>> getSent(@CurrentUser UserPrincipal currentUser) {
        List<FriendshipResponse> sent = friendshipService.getSentRequests(currentUser.getId())
                .stream().map(FriendshipResponse::from).toList();
        return ResponseEntity.ok(sent);
    }
}
