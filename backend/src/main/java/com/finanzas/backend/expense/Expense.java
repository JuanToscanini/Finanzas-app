package com.finanzas.backend.expense;

import com.finanzas.backend.category.Category;
import com.finanzas.backend.group.Group;
import com.finanzas.backend.split.Split;
import com.finanzas.backend.user.User;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "expenses")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(length = 3)
    private String currency;

    @Column(name = "split_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private SplitType splitType;

    @ManyToOne
    @JoinColumn(name = "group_id")
    private Group group;

    @ManyToOne(optional = false)
    @JoinColumn(name = "paid_by", nullable = false)
    private User paidBy;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "receipt_url")
    private String receiptUrl;

    @OneToMany(mappedBy = "expense", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Split> splits;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum SplitType {
        EQUAL, PERCENTAGE, EXACT
    }
}
