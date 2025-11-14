import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Article } from "@/lib/news";

const readableDate = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

type NewsArticleCardProps = {
  article: Article;
};

export function NewsArticleCard({ article }: NewsArticleCardProps) {
  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-lg">{article.title}</CardTitle>
        <CardDescription className="flex flex-wrap gap-2 text-xs uppercase tracking-wide">
          <span>{article.source.name}</span>
          {article.category && (
            <span className="text-muted-foreground">• {article.category}</span>
          )}
          <span className="text-muted-foreground">
            • {readableDate.format(new Date(article.publishedAt))}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="py-6">
        <p className="text-sm text-muted-foreground">
          {article.summary ||
            article.content?.slice(0, 160) ||
            "No summary available."}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {article.author && <span>By {article.author}</span>}
          {article.publisher?.name && (
            <span className="uppercase tracking-wide">
              {article.publisher.name}
            </span>
          )}
          <Button asChild variant="link" size="sm" className="px-0">
            <a href={article.url} target="_blank" rel="noreferrer noopener">
              Read article
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
