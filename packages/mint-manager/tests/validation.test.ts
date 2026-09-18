import { MintManagerError, MintManagerErrorCode } from "../src/errors";
import {
  MAX_LABEL_BYTES,
  MAX_NAME_BYTES,
  assertAddress,
  normalizeLabel,
  normalizeName,
  normalizeSubname,
} from "../src/validation";

/**
 * Runs `fn`, asserting it throws a MintManagerError carrying `code`, and
 * returns the error so individual tests can inspect the message.
 */
function expectMintError(
  fn: () => unknown,
  code: MintManagerErrorCode
): MintManagerError {
  let thrown: unknown;
  let returned: unknown;
  try {
    returned = fn();
  } catch (err) {
    thrown = err;
  }

  if (thrown === undefined) {
    throw new Error(
      `Expected a MintManagerError(${code}) but the call returned ${JSON.stringify(
        returned
      )}`
    );
  }

  expect(thrown).toBeInstanceOf(MintManagerError);
  const err = thrown as MintManagerError;
  expect(err.code).toBe(code);
  return err;
}

// Written as escapes on purpose: these characters are invisible or
// indistinguishable from ASCII in an editor, which is the whole point.
const CYRILLIC_ALICE = "аlice"; // U+0430 CYRILLIC SMALL LETTER A
const ZWSP_ALICE = "ali​ce"; // U+200B ZERO WIDTH SPACE
const ZWNJ_ALICE = "ali‌ce"; // U+200C ZERO WIDTH NON-JOINER
const ZWJ_ALICE = "ali‍ce"; // U+200D ZERO WIDTH JOINER
const CAFE_NFC = "café"; // é as a single code point
const CAFE_NFD = "café"; // e + U+0301 COMBINING ACUTE ACCENT

describe("normalizeName", () => {
  it("lowercases an uppercase name", () => {
    expect(normalizeName("Alice.eth")).toBe("alice.eth");
    expect(normalizeName("ALICE.ETH")).toBe("alice.eth");
  });

  it("leaves an already-normalized name untouched", () => {
    expect(normalizeName("alice.namespace.eth")).toBe("alice.namespace.eth");
  });

  it("converges NFC and NFD forms of the same name", () => {
    expect(CAFE_NFC).not.toBe(CAFE_NFD);
    expect(normalizeName(`${CAFE_NFD}.eth`)).toBe(normalizeName(`${CAFE_NFC}.eth`));
    expect(normalizeName(`${CAFE_NFD}.eth`)).toBe(`${CAFE_NFC}.eth`);
  });

  it("rejects an empty name", () => {
    const err = expectMintError(() => normalizeName(""), "INVALID_NAME");
    expect(err.message).toContain("empty");
  });

  it("rejects a non-string name", () => {
    expectMintError(
      () => normalizeName(undefined as unknown as string),
      "INVALID_NAME"
    );
    expectMintError(() => normalizeName(null as unknown as string), "INVALID_NAME");
    expectMintError(() => normalizeName(42 as unknown as string), "INVALID_NAME");
  });

  it("preserves the normalizer's own reason in the message", () => {
    const err = expectMintError(() => normalizeName("ali ce.eth"), "INVALID_NAME");

    // The reason text comes from @adraffy/ens-normalize, not from us.
    expect(err.message).toContain("disallowed character");
    expect(err.message).toContain('"ali ce.eth"');
    expect(err.details).toEqual({ name: "ali ce.eth" });
  });

  it("never silently maps a Cyrillic homoglyph onto the ASCII name", () => {
    // ENSIP-15 rejects this as a Cyrillic/Latin script mixture. The assertion
    // that matters is the weaker one: it must never come back as "alice.eth".
    let normalized: string | undefined;
    try {
      normalized = normalizeName(`${CYRILLIC_ALICE}.eth`);
    } catch (err) {
      expect(err).toBeInstanceOf(MintManagerError);
      expect((err as MintManagerError).code).toBe("INVALID_NAME");
    }

    if (normalized !== undefined) {
      expect(normalized).not.toBe("alice.eth");
    }
  });

  it("rejects a name over the 255-byte limit", () => {
    const longName = `${"a".repeat(60)}.`.repeat(5) + "eth"; // 308 bytes
    expect(longName.length).toBeGreaterThan(MAX_NAME_BYTES);

    const err = expectMintError(() => normalizeName(longName), "INVALID_NAME");
    expect(err.message).toContain(`${MAX_NAME_BYTES}-byte limit`);
  });

  it("accepts a name right at the byte limit", () => {
    const atLimit = new Array(4).fill("a".repeat(63)).join("."); // 255 bytes
    expect(atLimit.length).toBe(MAX_NAME_BYTES);
    expect(normalizeName(atLimit)).toBe(atLimit);
  });
});

describe("normalizeLabel", () => {
  it("lowercases an uppercase label", () => {
    expect(normalizeLabel("Alice")).toBe("alice");
    expect(normalizeLabel("ALICE")).toBe("alice");
  });

  it("converges NFC and NFD forms of the same label", () => {
    expect(CAFE_NFC).not.toBe(CAFE_NFD);
    expect(normalizeLabel(CAFE_NFD)).toBe(normalizeLabel(CAFE_NFC));
    expect(normalizeLabel(CAFE_NFD)).toBe(CAFE_NFC);
  });

  it("rejects a label containing a dot", () => {
    const err = expectMintError(
      () => normalizeLabel("alice.namespace.eth"),
      "INVALID_LABEL"
    );
    expect(err.message).toContain('cannot contain "."');
    expect(err.message).toContain("full name");
  });

  it("rejects a label that is only a dot", () => {
    expectMintError(() => normalizeLabel("."), "INVALID_LABEL");
  });

  it("rejects a trailing dot, which would otherwise hash as an empty label", () => {
    expectMintError(() => normalizeLabel("alice."), "INVALID_LABEL");
  });

  it("rejects the encoded-labelhash form", () => {
    // viem's namehash() consumes this as a raw labelhash, bypassing keccak.
    const labelhash = `[${"a".repeat(64)}]`;
    const err = expectMintError(() => normalizeLabel(labelhash), "INVALID_LABEL");
    expect(err.message).toContain("encoded labelhashes");
  });

  it("rejects an uppercase-hex encoded labelhash too", () => {
    expectMintError(() => normalizeLabel(`[${"AB".repeat(32)}]`), "INVALID_LABEL");
  });

  it("still rejects bracketed input that is not exactly 64 hex characters", () => {
    // Not the labelhash form, but ENSIP-15 disallows "[" regardless.
    expectMintError(() => normalizeLabel("[alice]"), "INVALID_LABEL");
  });

  it("rejects an empty label", () => {
    const err = expectMintError(() => normalizeLabel(""), "INVALID_LABEL");
    expect(err.message).toContain("empty");
  });

  it("rejects a non-string label", () => {
    expectMintError(
      () => normalizeLabel(undefined as unknown as string),
      "INVALID_LABEL"
    );
    expectMintError(() => normalizeLabel({} as unknown as string), "INVALID_LABEL");
  });

  it("rejects zero-width joiner and non-joiner characters", () => {
    expectMintError(() => normalizeLabel(ZWNJ_ALICE), "INVALID_LABEL");
    expectMintError(() => normalizeLabel(ZWJ_ALICE), "INVALID_LABEL");
  });

  it("collapses U+200B onto the plain label rather than keeping a lookalike", () => {
    // ENSIP-15 treats U+200B as ignorable, so it is stripped rather than
    // rejected. Either outcome is safe; what must never happen is a second,
    // visually identical label that hashes differently from "alice".
    expect(normalizeLabel(ZWSP_ALICE)).toBe("alice");
  });

  it("never silently maps a Cyrillic homoglyph onto the ASCII label", () => {
    let normalized: string | undefined;
    try {
      normalized = normalizeLabel(CYRILLIC_ALICE);
    } catch (err) {
      expect(err).toBeInstanceOf(MintManagerError);
      expect((err as MintManagerError).code).toBe("INVALID_LABEL");
    }

    if (normalized !== undefined) {
      expect(normalized).not.toBe("alice");
    }
  });

  it("rejects a 300-character label", () => {
    const err = expectMintError(
      () => normalizeLabel("a".repeat(300)),
      "INVALID_LABEL"
    );
    expect(err.message).toContain(`${MAX_LABEL_BYTES}-byte limit`);
  });

  it("accepts a label right at the byte limit", () => {
    const atLimit = "a".repeat(MAX_LABEL_BYTES);
    expect(normalizeLabel(atLimit)).toBe(atLimit);
  });

  it("counts UTF-8 bytes rather than code points for the label limit", () => {
    // U+4F60 is 3 UTF-8 bytes, so 21 fit within 63 bytes and 22 do not.
    const cjk = "你";
    expect(normalizeLabel(cjk.repeat(21))).toBe(cjk.repeat(21));
    expectMintError(() => normalizeLabel(cjk.repeat(22)), "INVALID_LABEL");
  });

  it("handles emoji labels per ENSIP-15", () => {
    // A plain emoji label is valid and normalizes to itself.
    expect(normalizeLabel("\u{1F525}")).toBe("\u{1F525}");

    // ENSIP-15 drops the optional FE0F variation selector, so the emoji and
    // text presentations of the same character converge on one label.
    expect(normalizeLabel("❤️")).toBe("❤");
    expect(normalizeLabel("❤️")).toBe(normalizeLabel("❤"));
  });
});

describe("normalizeSubname", () => {
  it("normalizes a full subname", () => {
    expect(normalizeSubname("Alice.Namespace.ETH")).toBe("alice.namespace.eth");
  });

  it("rejects a bare label with no parent", () => {
    const err = expectMintError(() => normalizeSubname("alice"), "INVALID_NAME");
    expect(err.message).toContain("parent label");
  });

  it("rejects an emoji-only bare label with no parent", () => {
    expectMintError(() => normalizeSubname("\u{1F525}"), "INVALID_NAME");
  });

  it("rejects an empty subname", () => {
    expectMintError(() => normalizeSubname(""), "INVALID_NAME");
  });

  it("rejects a subname whose parent fails normalization", () => {
    expectMintError(() => normalizeSubname(`alice.${ZWNJ_ALICE}.eth`), "INVALID_NAME");
  });
});

describe("assertAddress", () => {
  const LOWER = "0xd8da6bf26964af9d7eed9e03e53415d37aa96045";
  const CHECKSUMMED = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

  it("returns the checksummed form of a lowercase address", () => {
    expect(assertAddress(LOWER, "minterAddress")).toBe(CHECKSUMMED);
  });

  it("accepts an already-checksummed address", () => {
    expect(assertAddress(CHECKSUMMED, "owner")).toBe(CHECKSUMMED);
  });

  it("rejects a mixed-case address with a bad checksum", () => {
    const badChecksum = "0xD8da6bf26964af9d7eed9e03e53415d37aa96045";
    expectMintError(() => assertAddress(badChecksum, "owner"), "INVALID_ADDRESS");
  });

  it("rejects a too-short address and names the field", () => {
    const err = expectMintError(
      () => assertAddress("0x123", "minterAddress"),
      "INVALID_ADDRESS"
    );
    expect(err.message).toContain("minterAddress");
    expect(err.details).toEqual({ field: "minterAddress", value: "0x123" });
  });

  it("rejects an address without the 0x prefix", () => {
    expectMintError(
      () => assertAddress(LOWER.slice(2), "minterAddress"),
      "INVALID_ADDRESS"
    );
  });

  it("rejects an ENS name passed where an address was expected", () => {
    const err = expectMintError(
      () => assertAddress("alice.eth", "owner"),
      "INVALID_ADDRESS"
    );
    expect(err.message).toContain("resolve it to an address");
  });

  it("rejects empty, null and undefined", () => {
    expectMintError(() => assertAddress("", "owner"), "INVALID_ADDRESS");
    expectMintError(
      () => assertAddress(null as unknown as string, "owner"),
      "INVALID_ADDRESS"
    );
    expectMintError(
      () => assertAddress(undefined as unknown as string, "owner"),
      "INVALID_ADDRESS"
    );
  });
});
