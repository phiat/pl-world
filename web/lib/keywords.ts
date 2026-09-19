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

export const ICON = {
  // All 29 reserved words, from the lexer's table in the Icon source.
  keywords: "break by case create default do else end every fail global if initial invocable link local next not " +
    "of procedure record repeat return static suspend then to until while",
  builtins: "write writes read reads stop tab move upto many any match find bal pos trim left right center repl " +
    "reverse map type image put push pop get pull list table set insert delete member key sort sortf copy proc args " +
    "char ord string integer real numeric cset seq abs exit open close flush system getenv collect display variable " +
    "name runerr errorclear",
};

export const MODULA3 = {
  // The reserved words and reserved identifiers of the language definition; all are upper case, and case matters.
  keywords: "AND ANY ARRAY AS BEGIN BITS BRANDED BY CASE CONST DIV DO ELSE ELSIF END EVAL EXCEPT EXCEPTION EXIT " +
    "EXPORTS FINALLY FOR FROM GENERIC IF IMPORT IN INTERFACE LOCK LOOP METHODS MOD MODULE NOT OBJECT OF OR " +
    "OVERRIDES PROCEDURE RAISE RAISES READONLY RECORD REF REPEAT RETURN REVEAL SET THEN TO TRY TYPE TYPECASE UNSAFE " +
    "UNTIL UNTRACED VALUE VAR WHILE WITH",
  types: "ADDRESS BOOLEAN CARDINAL CHAR EXTENDED INTEGER LONGCARD LONGINT LONGREAL MUTEX NULL REAL REFANY ROOT TEXT " +
    "WIDECHAR",
  builtins: "ABS ADR ADRSIZE BITSIZE BYTESIZE CEILING DEC DISPOSE FIRST FLOAT FLOOR INC ISTYPE LAST LOOPHOLE MAX MIN " +
    "NARROW NEW NUMBER ORD ROUND SUBARRAY TRUNC TYPECODE VAL",
  literals: "TRUE FALSE NIL",
};

export const SNOBOL = {
  // SNOBOL has no reserved words: these are the pattern primitives, the built-in functions and the I/O variables.
  builtins: "ABORT ANY ARB ARBNO BAL BREAK BREAKX FAIL FENCE LEN NOTANY POS REM RPOS RTAB SPAN SUCCEED TAB " +
    "APPLY ARG ARRAY CODE CONVERT COPY DATA DATATYPE DATE DEFINE DIFFER DUPL EQ EVAL FIELD GE GT IDENT INPUT " +
    "INTEGER ITEM LE LGT LOCAL LPAD LT NE OPSYN OUTPUT PROTOTYPE REMDR REPLACE REVERSE RPAD SETEXIT SIZE SORT " +
    "SUBSTR TABLE TERMINAL TIME TRIM VALUE",
  // Labels the system defines: END stops the program, the others return from a function.
  labels: "END RETURN FRETURN NRETURN",
};

export const TCL = {
  // highlight.js's Tcl commands, plus those added since 8.5 (lmap, try, tailcall, coroutine, lseq…).
  keywords: "after append apply array auto_execok auto_import auto_load auto_mkindex auto_mkindex_old auto_qualify " +
    "auto_reset bgerror binary break catch cd chan clock close concat continue coroutine dde dict encoding eof " +
    "error eval exec exit expr fblocked fconfigure fcopy file fileevent filename flush for foreach format gets glob " +
    "global history http if incr info interp join lappend lassign ledit lindex linsert list llength lmap load lpop " +
    "lrange lremove lrepeat lreplace lreverse lsearch lseq lset lsort mathfunc mathop memory msgcat namespace open " +
    "package parray pid pkg::create pkg_mkIndex platform platform::shell proc puts pwd read refchan regexp registry " +
    "regsub rename return safe scan seek set socket source split string subst switch tailcall tcl_endOfWord " +
    "tcl_findLibrary tcl_startOfNextWord tcl_startOfPreviousWord tcl_wordBreakAfter tcl_wordBreakBefore tcltest " +
    "tclvars tell throw time tm trace try unknown unload unset update uplevel upvar variable vwait while yield " +
    "yieldto zlib",
};
