package com.finanzas.backend.user;

import com.finanzas.backend.common.exception.DuplicateResourceException;
import com.finanzas.backend.common.exception.ResourceNotFoundException;
import com.finanzas.backend.common.exception.UnauthorizedException;
import com.finanzas.backend.common.exception.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FriendshipService {

    private final FriendshipRepository friendshipRepository;
    private final UserService userService;

    public Friendship sendFriendRequest(Long requesterId, Long addresseeId) {
        if (requesterId.equals(addresseeId)) {
            throw new ValidationException("No podés enviarte una solicitud de amistad a vos mismo");
        }

        User requester = userService.getById(requesterId);
        User addressee = userService.getById(addresseeId);

        if (friendshipRepository.existsByRequesterAndAddressee(requester, addressee) ||
            friendshipRepository.existsByRequesterAndAddressee(addressee, requester)) {
            throw new DuplicateResourceException("Ya existe una relación entre estos usuarios");
        }

        Friendship friendship = new Friendship();
        friendship.setRequester(requester);
        friendship.setAddressee(addressee);
        friendship.setStatus(Friendship.Status.PENDING);
        return friendshipRepository.save(friendship);
    }

    public Friendship acceptFriendRequest(Long friendshipId, Long userId) {
        Friendship friendship = getById(friendshipId);

        if (!friendship.getAddressee().getId().equals(userId)) {
            throw new UnauthorizedException("Solo el destinatario puede aceptar la solicitud");
        }

        friendship.setStatus(Friendship.Status.ACCEPTED);
        return friendshipRepository.save(friendship);
    }

    public void rejectFriendRequest(Long friendshipId, Long userId) {
        Friendship friendship = getById(friendshipId);

        if (!friendship.getAddressee().getId().equals(userId)) {
            throw new UnauthorizedException("Solo el destinatario puede rechazar la solicitud");
        }

        friendshipRepository.delete(friendship);
    }

    public Friendship blockUser(Long friendshipId, Long userId) {
        Friendship friendship = getById(friendshipId);

        if (!friendship.getRequester().getId().equals(userId) &&
            !friendship.getAddressee().getId().equals(userId)) {
            throw new UnauthorizedException("No podés bloquear una amistad que no te pertenece");
        }

        friendship.setStatus(Friendship.Status.BLOCKED);
        return friendshipRepository.save(friendship);
    }

    public List<Friendship> getFriends(Long userId) {
        User user = userService.getById(userId);
        return friendshipRepository.findByUserAndStatus(user, Friendship.Status.ACCEPTED);
    }

    public List<Friendship> getPendingRequests(Long userId) {
        User user = userService.getById(userId);
        return friendshipRepository.findByAddresseeAndStatus(user, Friendship.Status.PENDING);
    }

    public List<Friendship> getSentRequests(Long userId) {
        User user = userService.getById(userId);
        return friendshipRepository.findByRequesterAndStatus(user, Friendship.Status.PENDING);
    }

    private Friendship getById(Long id) {
        return friendshipRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Solicitud de amistad no encontrada: " + id));
    }
}
