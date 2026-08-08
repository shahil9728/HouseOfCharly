import { redirect } from "next/navigation";
/* The cart lives in a drawer; /cart exists so the URL never 404s. */
export default function CartPage() { redirect("/checkout"); }
