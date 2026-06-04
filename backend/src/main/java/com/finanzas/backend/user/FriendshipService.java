package com.finanzas.backend.user;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FriendshipService {

    private final FriendshipRepository friendshipRepository;
    private final UserService userService;

    public Friendship sendFriendRequest(Long requesterId, Long addresseeId) {
        User requester = userService.getById(requesterId);
        User addressee = userService.getById(addresseeId);

        if (friendshipRepository.existsByRequesterAndAddressee(requester, addressee) ||
            friendshipRepository.existsByRequesterAndAddressee(addressee, requester)) {
            throw new RuntimeException("Ya existe una relación entre estos usuarios");
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
            throw new RuntimeException("Solo el destinatario puede aceptar la solicitud");
        }

        friendship.setStatus(Friendship.Status.ACCEPTED);
        return friendshipRepository.save(friendship);
    }

    public void rejectFriendRequest(Long friendshipId, Long userId) {
        Friendship friendship = getById(friendshipId);

        if (!friendship.getAddressee().getId().equals(userId)) {
            throw new RuntimeException("Solo el destinatario puede rechazar la solicitud");
        }

        friendshipRepository.delete(friendship);
    }

    public Friendship blockUser(Long friendshipId, Long userId) {
        Friendship friendship = getById(friendshipId);

        if (!friendship.getRequester().getId().equals(userId) &&
            !friendship.getAddressee().getId().equals(userId)) {
            throw new RuntimeException("No podés bloquear una amistad que no te pertenece");
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
                .orElseThrow(() -> new RuntimeException("Solicitud de amistad no encontrada: " + id));
    }
}
