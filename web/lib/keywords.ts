// Word lists for languages with a hand-written grammar, shared by the server highlighter (lib/highlight.ts) and the
// client editor (lib/editor.ts) so the two colour a snippet the same way.

export const ODIN = {
  keywords: "package import foreign proc struct union enum bit_set bit_field map matrix distinct dynamic using " +
    "if else when for in not_in do switch case fallthrough break continue return defer or_return or_else or_break " +
    "or_continue cast transmute auto_cast context where asm",
  types: "bool b8 b16 b32 b64 int uint i8 i16 i32 i64 i128 u8 u16 u32 u64 u128 uintptr " +
    "i16le i32le i64le i128le u16le u32le u64le u128le i16be i32be i64be i128be u16be u32be u64be u128be " +
    "f16 f32 f64 f16le f32le f64le f16be f32be f64be complex32 complex64 complex128 " +
    "quaternion64 quaternion128 quaternion256 rune string cstring string16 cstring16 rawptr typeid any byte",
  builtins: "len cap size_of align_of offset_of offset_of_by_string type_of type_info_of typeid_of " +
    "swizzle complex quaternion real imag jmag kmag conj expand_values min max abs clamp soa_zip soa_unzip " +
    "new new_clone free free_all make delete append inject_at assign_at clear reserve resize copy unordered_remove " +
    "ordered_remove pop assert panic unreachable raw_data",
  literals: "true false nil",
};

export const LOGO = {
  keywords: "to end .macro .defmacro if ifelse test iftrue ift iffalse iff repeat forever for while until do.while " +
    "do.until foreach output op stop catch throw local localmake make name run runresult goto tag",
  builtins: "print pr show type first butfirst bf last butlast bl fput lput sentence se word list item count " +
    "emptyp memberp equalp wordp listp numberp remainder modulo sum difference product quotient power sqrt random " +
    "pick iseq map filter reduce apply invoke text define thing error forward fd back bk left lt right rt penup pu " +
    "pendown pd home clearscreen cs setxy setheading seth pos heading repcount readlist readword bye",
  literals: "true false",
};

export const LEAN = {
  keywords: "def theorem lemma abbrev example instance structure class inductive coinductive where extends deriving " +
    "namespace section end open export variable universe axiom opaque noncomputable partial unsafe private protected " +
    "public module import mutual macro macro_rules syntax elab elab_rules notation infix infixl infixr prefix postfix " +
    "set_option attribute local scoped termination_by decreasing_by fun λ match with if then else do let mut have " +
    "show from by return for in unless while repeat break continue try catch finally throw calc suffices nomatch " +
    "nofun at sorry admit",
  // Core tactics (Mathlib adds many more).
  tactics: "rfl simp simp_all simp_arith dsimp omega decide native_decide grind exact apply intro intros induction " +
    "cases rcases obtain constructor rw rewrite unfold refine trivial contradiction assumption exists funext ext " +
    "congr subst injection split next case all_goals any_goals first repeat' focus exfalso rename_i specialize " +
    "generalize bv_decide mvcgen",
  types: "Nat Int Float String Char Bool Unit Prop Type Sort List Array Option IO Fin UInt8 UInt16 UInt32 UInt64 " +
    "USize Thunk Task Except ExceptT StateT ReaderT EIO BaseIO ST Vector Std",
  literals: "true false none some True False",
};

export const UNISON = {
  // The reserved words of the language reference, less true/false.
  keywords: "ability alias cases do else forall handle if let match namespace structural termLink then type " +
    "typeLink unique use where with",
  literals: "true false",
};

export const V = {
  // The keyword appendix of V's documentation, less the literals.
  keywords: "as asm assert atomic break const continue defer else enum fn for go goto if implements import in " +
    "interface is isreftype lock match module mut or pub return rlock select shared sizeof spawn static struct " +
    "type typeof union unsafe volatile __global __offsetof",
  types: "bool string rune i8 i16 i32 int i64 isize u8 u16 u32 u64 usize f32 f64 voidptr byteptr charptr byte " +
    "any thread chan map",
  // `it` (in map/filter/any/all) and `err` (in or { } blocks) are implicit variables.
  builtins: "print println eprint eprintln exit panic dump error error_with_code it err",
  literals: "true false none nil",
};
