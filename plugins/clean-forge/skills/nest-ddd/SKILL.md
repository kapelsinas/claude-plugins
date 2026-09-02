---
name: nest-ddd
description: Module layout and dependency rules for NestJS (and Next.js consumers) in a Clean Forge project - domain/application/infrastructure/presentation layers, ports and adapters, public surfaces. Use when creating or placing code in a Nest module, writing plan.md, or fixing dependency-cruiser violations.
---

# Layout (one Nest module = one bounded context)

```
src/modules/<name>/
  index.ts                 # THE public surface. Only file other modules may import.
  <name>.module.ts         # Nest wiring only. No logic.
  domain/                  # Pure TypeScript. Zero framework imports.
    <aggregate>.ts         # entities/aggregates with behavior, not anemic bags
    <value-object>.ts      # Money, Email, Percentage... validate in constructor/factory
    <name>.errors.ts       # class XError extends DomainError
    events/                # domain events (plain classes)
  application/
    ports/                 # abstract class FooRepository { abstract find(id): Promise<Foo|null> }
    use-cases/             # one class per use case: execute(cmd): Promise<Result>
    dto/                   # input/output shapes for use cases (plain types)
  infrastructure/
    persistence/           # adapters implementing ports (Prisma/TypeORM/Mongo)
    http/                  # outbound clients
    <name>.providers.ts    # { provide: FooRepository, useClass: PrismaFooRepository }
  presentation/            # optional; can also be a separate app
    <name>.controller.ts   # maps HTTP <-> use case. No business logic.
    <name>.dto.ts          # class-validator DTOs (framework-specific, stays here)
```

# Dependency rules (enforced by `.dependency-cruiser.cjs`)
- `domain` → nothing but `domain` (same module) and shared kernel (`src/shared/domain`).
- `application` → `domain`, `application/ports`. Never `infrastructure`, never `presentation`.
- `infrastructure` → `application/ports`, `domain`. Never `presentation`.
- `presentation` → `application` (use cases + dto). Never `infrastructure`, never `domain` internals.
- `<name>.module.ts` → anything inside its own module (it is the composition root).
- Cross-module: only `import { X } from '@/modules/other'` (the `index.ts`). Never a deep path.
- `src/shared/` may not import from `src/modules/`.
- Next.js (`apps/web`): imports a generated API client or `packages/contracts`, never `apps/api/src/**`.

# Ports as abstract classes
```ts
// application/ports/discount.repository.ts
export abstract class DiscountRepository {
  abstract findActiveByProduct(productId: ProductId): Promise<Discount | null>;
  abstract save(discount: Discount): Promise<void>;
}
```
Abstract classes double as Nest injection tokens; no `@Inject('TOKEN')` strings.

# Use case shape
```ts
@Injectable()
export class ApplyDiscount {
  constructor(private readonly products: ProductRepository, private readonly clock: Clock) {}
  async execute(cmd: ApplyDiscountCommand): Promise<ApplyDiscountResult> {
    const product = await this.products.findById(cmd.productId) ?? raise(new ProductNotFound(cmd.productId));
    product.apply(Discount.from(cmd), this.clock.now());
    await this.products.save(product);
    return { effectivePrice: product.effectivePrice(this.clock.now()) };
  }
}
```
`Clock`, `IdGenerator`, `EventBus` are ports too — never `new Date()` / `randomUUID()` inside domain or use cases (kills determinism in tests and property tests).

# Acceptance step definitions reach the app through
1. the use case directly (fast, default), or
2. `Test.createTestingModule({ imports: [AppModule] })` + supertest when the scenario is about HTTP behavior (status codes, auth).
Never through repositories or DB directly, except a `Given` that seeds via a port.

# What goes where — quick test
- "Would this still be true if we swapped Nest for Fastify and Prisma for Mongo?" → `domain`.
- "Is this a step of a user's intent?" → `application/use-cases`.
- "Does it talk to something outside the process?" → `infrastructure`.
- "Does it parse HTTP/GraphQL/CLI input?" → `presentation`.

# Sizes
- Function cyclomatic complexity ≤ 6 (gate). Function ≤ 40 lines. Class ≤ 7 public methods. File ≤ 200 lines. These are gate numbers, not aspirations.
