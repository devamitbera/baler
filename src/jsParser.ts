import * as acorn from 'acorn';
import * as acornLoose from 'acorn-loose';
import { Program, ObjectExpression } from 'estree';

type Opts = {
    loose: boolean;
};

/**
 * @summary Parse JavaScript into an ESTree AST. Can optionally
 *          use an error-tolerant loose parser, which is useful
 *          for JS intermingled with PHP
 */
export function parse(input: string, opts?: Opts) {
    const isLoose = opts && opts.loose;
    const parser = (isLoose ? acornLoose : acorn).parse;
    const ast = (parser(input) as any) as Program;

    return ast;
}

/**
 * @summary Attempt to parse an ObjectExpression from the input.
 *          If parsing fails in "strict" mode (default), will automatically
 *          retry in "loose" mode
 */
export function parseObjectExpression(
    input: string,
    loose?: boolean,
): ObjectExpression {
    const hasOpeningBrace = /\s*\{/.test(input);
    // {} is a block in statement position, so we need to wrap
    // in () to force an expression, if that hasn't
    const inputCleaned = hasOpeningBrace ? `(${input})` : input;

    try {
        const ast = parse(inputCleaned, { loose: !!loose });
        const [firstStmt] = ast.body;
        if (
            firstStmt.type === 'ExpressionStatement' &&
            firstStmt.expression.type === 'ObjectExpression'
        ) {
            return firstStmt.expression as ObjectExpression;
        } else {
            throw new Error('Unable to parse object expression');
        }
    } catch (err) {
        if (!loose) {
            return parseObjectExpression(inputCleaned, true);
        }

        throw err;
    }
}