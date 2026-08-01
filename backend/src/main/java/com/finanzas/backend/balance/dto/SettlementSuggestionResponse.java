package com.finanzas.backend.balance.dto;

import com.finanzas.backend.user.User;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SettlementSuggestionResponse {

    private Long fromUserId;
    private String fromUsername;
    private Long toUserId;
    private String toUsername;
    private BigDecimal amount;

    public static SettlementSuggestionResponse of(User from, User to, BigDecimal amount) {
        return new SettlementSuggestionResponse(
                from.getId(), from.getUsername(),
                to.getId(), to.getUsername(),
                amount
        );
    }
}
