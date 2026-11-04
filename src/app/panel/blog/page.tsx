import { redirect } from "next/navigation";

/** Panel içi blog bağlantıları tek kaynak olan /blog'a yönlenir. */
export default function PanelBlog() {
  redirect("/blog");
}
