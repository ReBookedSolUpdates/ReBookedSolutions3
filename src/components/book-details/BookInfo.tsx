import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Book } from '@/types/book';

interface BookInfoProps {
  book: Book;
}

const BookInfo = ({ book }: BookInfoProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">{book.title}</h1>
        <p className="text-lg md:text-xl text-gray-600 mb-4">by {book.author}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="secondary">{book.category}</Badge>
          <Badge variant="outline">{book.condition}</Badge>
          {book.sold && <Badge variant="destructive">Sold</Badge>}
        </div>
      </div>

      {/* Book Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Book Details</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <dt className="text-sm text-muted-foreground">Category</dt>
              <dd className="font-medium">{book.category}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Condition</dt>
              <dd className="font-medium">{book.condition}</dd>
            </div>
            {typeof book.availableQuantity === 'number' && (
              <div>
                <dt className="text-sm text-muted-foreground">Available</dt>
                <dd className="font-medium">{book.availableQuantity}</dd>
              </div>
            )}
            {book.universityYear && (
              <div>
                <dt className="text-sm text-muted-foreground">University Year</dt>
                <dd className="font-medium">{book.universityYear}</dd>
              </div>
            )}
            {book.grade && (
              <div>
                <dt className="text-sm text-muted-foreground">Grade</dt>
                <dd className="font-medium">{book.grade}</dd>
              </div>
            )}
            {book.curriculum && (
              <div>
                <dt className="text-sm text-muted-foreground">Curriculum</dt>
                <dd className="font-medium">{book.curriculum}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookInfo;
