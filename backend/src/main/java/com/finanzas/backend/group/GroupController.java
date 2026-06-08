package com.finanzas.backend.group;

import com.finanzas.backend.group.dto.CreateGroupRequest;
import com.finanzas.backend.group.dto.GroupResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;

    @PostMapping
    public ResponseEntity<GroupResponse> create(
            @Valid @RequestBody CreateGroupRequest request,
            @RequestHeader("X-User-Id") Long userId) {
        Group group = groupService.createGroup(userId, request.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(GroupResponse.from(group));
    }

    @GetMapping("/{id}")
    public ResponseEntity<GroupResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(GroupResponse.from(groupService.getById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<GroupResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateGroupRequest request,
            @RequestHeader("X-User-Id") Long userId) {
        Group group = groupService.updateGroup(id, userId, request.getName());
        return ResponseEntity.ok(GroupResponse.from(group));
    }

    @GetMapping
    public ResponseEntity<List<GroupResponse>> getMyGroups(@RequestHeader("X-User-Id") Long userId) {
        List<GroupResponse> groups = groupService.getGroupsForUser(userId)
                .stream().map(GroupResponse::from).toList();
        return ResponseEntity.ok(groups);
    }

    @PostMapping("/{id}/members/{memberId}")
    public ResponseEntity<GroupResponse> addMember(
            @PathVariable Long id,
            @PathVariable Long memberId,
            @RequestHeader("X-User-Id") Long userId) {
        Group group = groupService.addMember(id, userId, memberId);
        return ResponseEntity.ok(GroupResponse.from(group));
    }

    @DeleteMapping("/{id}/members/{memberId}")
    public ResponseEntity<GroupResponse> removeMember(
            @PathVariable Long id,
            @PathVariable Long memberId,
            @RequestHeader("X-User-Id") Long userId) {
        Group group = groupService.removeMember(id, userId, memberId);
        return ResponseEntity.ok(GroupResponse.from(group));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId) {
        groupService.deactivateGroup(id, userId);
        return ResponseEntity.noContent().build();
    }
}
