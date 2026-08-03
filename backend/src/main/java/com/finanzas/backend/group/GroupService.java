package com.finanzas.backend.group;

import com.finanzas.backend.common.exception.DuplicateResourceException;
import com.finanzas.backend.common.exception.ResourceNotFoundException;
import com.finanzas.backend.common.exception.UnauthorizedException;
import com.finanzas.backend.common.exception.ValidationException;
import com.finanzas.backend.notification.NotificationService;
import com.finanzas.backend.user.User;
import com.finanzas.backend.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GroupService {

    private final GroupRepository groupRepository;
    private final UserService userService;
    private final NotificationService notificationService;

    @Transactional
    public Group createGroup(Long creatorId, String name) {
        User creator = userService.getById(creatorId);

        Group group = new Group();
        group.setName(name);
        group.setCreatedBy(creator);
        group.setIsActive(true);
        group.setMembers(new ArrayList<>(List.of(creator)));

        return groupRepository.save(group);
    }

    @Transactional
    public Group addMember(Long groupId, Long userId, Long memberId) {
        Group group = getById(groupId);
        validateMember(group, userId);

        User actor = userService.getById(userId);
        User member = userService.getById(memberId);
        if (group.getMembers().stream().anyMatch(u -> u.getId().equals(memberId))) {
            throw new DuplicateResourceException("El usuario ya es miembro del grupo");
        }

        group.getMembers().add(member);
        Group saved = groupRepository.save(group);

        String message = String.format("%s te agregó al grupo %s", actor.getUsername(), saved.getName());
        notificationService.create(memberId, "GROUP_MEMBER_ADDED", message, saved.getId(), "GROUP");

        return saved;
    }

    @Transactional
    public Group removeMember(Long groupId, Long userId, Long memberId) {
        Group group = getById(groupId);
        validateMember(group, userId);

        if (group.getCreatedBy().getId().equals(memberId)) {
            throw new ValidationException("No podés eliminar al creador del grupo");
        }

        boolean removed = group.getMembers().removeIf(u -> u.getId().equals(memberId));
        if (!removed) {
            throw new ResourceNotFoundException("El usuario no es miembro del grupo");
        }

        return groupRepository.save(group);
    }

    @Transactional
    public Group updateGroup(Long groupId, Long userId, String newName) {
        Group group = getById(groupId);
        validateMember(group, userId);

        group.setName(newName);
        return groupRepository.save(group);
    }

    public Group getById(Long groupId) {
        return groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Grupo no encontrado: " + groupId));
    }

    public List<Group> getGroupsForUser(Long userId) {
        User user = userService.getById(userId);
        return groupRepository.findByMembersContainingAndIsActiveTrue(user);
    }

    @Transactional
    public void deactivateGroup(Long groupId, Long userId) {
        Group group = getById(groupId);

        if (!group.getCreatedBy().getId().equals(userId)) {
            throw new UnauthorizedException("Solo el creador puede desactivar el grupo");
        }

        group.setIsActive(false);
        groupRepository.save(group);
    }

    private void validateMember(Group group, Long userId) {
        boolean isMember = group.getMembers().stream()
                .anyMatch(u -> u.getId().equals(userId));
        if (!isMember) {
            throw new UnauthorizedException("No sos miembro de este grupo");
        }
    }
}
