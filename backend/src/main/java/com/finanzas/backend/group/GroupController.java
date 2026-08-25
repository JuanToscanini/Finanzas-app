package com.finanzas.backend.group;

import com.finanzas.backend.auth.CurrentUser;
import com.finanzas.backend.auth.UserPrincipal;
import com.finanzas.backend.balance.BalanceService;
import com.finanzas.backend.balance.dto.GroupBalanceResponse;
import com.finanzas.backend.common.exception.UnauthorizedException;
import com.finanzas.backend.group.dto.CreateGroupRequest;
import com.finanzas.backend.group.dto.GroupResponse;
import com.finanzas.backend.group.dto.UpdateGroupRequest;
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
    private final BalanceService balanceService;

    @PostMapping
    public ResponseEntity<GroupResponse> create(
            @Valid @RequestBody CreateGroupRequest request,
            @CurrentUser UserPrincipal currentUser) {
        Group group = groupService.createGroup(currentUser.getId(), request.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(GroupResponse.from(group));
    }

    @GetMapping("/{id}")
    public ResponseEntity<GroupResponse> getById(
            @PathVariable Long id,
            @CurrentUser UserPrincipal currentUser) {
        Group group = groupService.getById(id);
        boolean isMember = group.getMembers().stream()
                .anyMatch(u -> u.getId().equals(currentUser.getId()));
        if (!isMember) {
            throw new UnauthorizedException("No sos miembro de este grupo");
        }
        return ResponseEntity.ok(GroupResponse.from(group));
    }

    @PutMapping("/{id}")
    public ResponseEntity<GroupResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateGroupRequest request,
            @CurrentUser UserPrincipal currentUser) {
        Group group = groupService.updateGroup(id, currentUser.getId(), request.getName());
        return ResponseEntity.ok(GroupResponse.from(group));
    }

    @GetMapping
    public ResponseEntity<List<GroupResponse>> getMyGroups(@CurrentUser UserPrincipal currentUser) {
        List<GroupResponse> groups = groupService.getGroupsForUser(currentUser.getId())
                .stream().map(GroupResponse::from).toList();
        return ResponseEntity.ok(groups);
    }

    @PostMapping("/{id}/members/{memberId}")
    public ResponseEntity<GroupResponse> addMember(
            @PathVariable Long id,
            @PathVariable Long memberId,
            @CurrentUser UserPrincipal currentUser) {
        Group group = groupService.addMember(id, currentUser.getId(), memberId);
        return ResponseEntity.ok(GroupResponse.from(group));
    }

    @DeleteMapping("/{id}/members/{memberId}")
    public ResponseEntity<GroupResponse> removeMember(
            @PathVariable Long id,
            @PathVariable Long memberId,
            @CurrentUser UserPrincipal currentUser) {
        Group group = groupService.removeMember(id, currentUser.getId(), memberId);
        return ResponseEntity.ok(GroupResponse.from(group));
    }

    @GetMapping("/{id}/balance")
    public ResponseEntity<GroupBalanceResponse> getBalance(
            @PathVariable Long id,
            @CurrentUser UserPrincipal currentUser) {
        return ResponseEntity.ok(balanceService.calculateGroupBalance(id, currentUser.getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(
            @PathVariable Long id,
            @CurrentUser UserPrincipal currentUser) {
        groupService.deactivateGroup(id, currentUser.getId());
        return ResponseEntity.noContent().build();
    }
}
