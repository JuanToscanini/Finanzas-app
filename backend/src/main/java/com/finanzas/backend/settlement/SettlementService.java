package com.finanzas.backend.settlement;

import com.finanzas.backend.common.exception.ResourceNotFoundException;
import com.finanzas.backend.common.exception.UnauthorizedException;
import com.finanzas.backend.common.exception.ValidationException;
import com.finanzas.backend.group.Group;
import com.finanzas.backend.group.GroupService;
import com.finanzas.backend.user.User;
import com.finanzas.backend.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SettlementService {

    private final SettlementRepository settlementRepository;
    private final GroupService groupService;
    private final UserService userService;

    @Transactional
    public Settlement createSettlement(Long groupId, Long paidById, Long paidToId,
                                       BigDecimal amount, String currency, String notes) {
        if (paidById.equals(paidToId)) {
            throw new ValidationException("No podés registrar un pago a vos mismo");
        }
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ValidationException("El monto debe ser mayor a cero");
        }

        Group group = groupService.getById(groupId);
        validateGroupMember(group, paidById);

        User paidBy = userService.getById(paidById);
        User paidTo = userService.getById(paidToId);
        validateGroupMember(group, paidToId);

        Settlement settlement = new Settlement();
        settlement.setGroup(group);
        settlement.setPaidBy(paidBy);
        settlement.setPaidTo(paidTo);
        settlement.setAmount(amount);
        settlement.setCurrency(currency);
        settlement.setNotes(notes);
        settlement.setStatus(Settlement.Status.PENDING);

        return settlementRepository.save(settlement);
    }

    @Transactional
    public Settlement confirmSettlement(Long settlementId, Long userId) {
        Settlement settlement = getById(settlementId);

        if (!settlement.getPaidTo().getId().equals(userId)) {
            throw new UnauthorizedException("Solo quien recibe el pago puede confirmarlo");
        }
        if (settlement.getStatus() != Settlement.Status.PENDING) {
            throw new ValidationException("Este settlement ya fue procesado");
        }

        settlement.setStatus(Settlement.Status.CONFIRMED);
        settlement.setSettledAt(LocalDateTime.now());
        return settlementRepository.save(settlement);
    }

    @Transactional
    public Settlement rejectSettlement(Long settlementId, Long userId) {
        Settlement settlement = getById(settlementId);

        if (!settlement.getPaidTo().getId().equals(userId)) {
            throw new UnauthorizedException("Solo quien recibe el pago puede rechazarlo");
        }
        if (settlement.getStatus() != Settlement.Status.PENDING) {
            throw new ValidationException("Este settlement ya fue procesado");
        }

        settlement.setStatus(Settlement.Status.REJECTED);
        return settlementRepository.save(settlement);
    }

    public Settlement getById(Long settlementId) {
        return settlementRepository.findById(settlementId)
                .orElseThrow(() -> new ResourceNotFoundException("Settlement no encontrado: " + settlementId));
    }

    public List<Settlement> getByGroup(Long groupId) {
        Group group = groupService.getById(groupId);
        return settlementRepository.findByGroup(group);
    }

    public List<Settlement> getByUser(Long userId) {
        User user = userService.getById(userId);
        return settlementRepository.findByPaidByOrPaidTo(user, user);
    }

    private void validateGroupMember(Group group, Long userId) {
        boolean isMember = group.getMembers().stream()
                .anyMatch(u -> u.getId().equals(userId));
        if (!isMember) {
            throw new UnauthorizedException("El usuario no es miembro del grupo");
        }
    }
}
