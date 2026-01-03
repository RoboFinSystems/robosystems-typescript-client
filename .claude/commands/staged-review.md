Review all staged changes (`git diff --cached`) with focus on these contexts:

## SDK Implementation Context

**SDK Methods & Extensions:**

- Are new methods properly typed?
- Do extensions follow existing patterns?
- Is error handling consistent?

**Generated Code:**

- Are changes to `*.gen.ts` files intentional?
- Do generated types match API schema?
- Is `prepare.js` updated if needed?

**Type Definitions:**

- Are types properly exported?
- Are generics used appropriately?
- Is backwards compatibility maintained?

## API Integration Context

- Are API calls properly authenticated?
- Is error handling appropriate?
- Are request/response types correct?

## Testing Context

- Do new methods have corresponding tests?
- Are edge cases covered?
- Is test coverage maintained?

## Documentation Context

- Is README updated for new features?
- Are JSDoc comments complete?
- Are examples provided for new methods?

## Output

Provide a summary with:

1. **Issues**: Problems that should be fixed before commit
2. **Suggestions**: Improvements that aren't blocking
3. **Questions**: Anything unclear that needs clarification
