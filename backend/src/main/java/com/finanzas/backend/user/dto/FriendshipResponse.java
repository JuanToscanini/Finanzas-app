package com.finanzas.backend.user.dto;

import com.finanzas.backend.user.Friendship;
import lombok.Data;

@Data
public class FriendshipResponse {
    private Long id;
    private UserResponse requester;
    private UserResponse addressee;
    private String status;

    public static FriendshipResponse from(Friendship friendship) {
        FriendshipResponse dto = new FriendshipResponse();
        dto.id = friendship.getId();
        dto.requester = UserResponse.from(friendship.getRequester());
        dto.addressee = UserResponse.from(friendship.getAddressee());
        dto.status = friendship.getStatus().name();
        return dto;
    }
}
