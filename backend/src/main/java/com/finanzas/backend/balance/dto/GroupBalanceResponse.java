package com.finanzas.backend.balance.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GroupBalanceResponse {

    private Long groupId;
    private List<UserBalanceResponse> balances;
    private List<SettlementSuggestionResponse> suggestedSettlements;
}
