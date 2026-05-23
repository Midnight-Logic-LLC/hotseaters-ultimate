import { useState } from 'react';
import { Accordion } from '@/components/ui/accordion';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Calendar } from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible } from '@/components/ui/collapsible';
import { Dialog } from '@/components/ui/dialog';
import { Empty } from '@/components/ui/empty';
import { Field } from '@/components/ui/field';
import { HoverCard } from '@/components/ui/hover-card';
import { Input } from '@/components/ui/input';
import { Item } from '@/components/ui/item';
import { Kbd } from '@/components/ui/kbd';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Popover } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { RadioGroup } from '@/components/ui/radio-group';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { Separator } from '@/components/ui/separator';
import { Sheet } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { Tabs } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup } from '@/components/ui/toggle-group';
import { Tooltip } from '@/components/ui/tooltip';

/**
 * UI sandbox — Change 2 smoke surface.
 *
 * Renders one example of each shadcn/base-ui primitive copied from the
 * example-app. Purpose: confirm every primitive imports + renders without
 * crash. Visual polish is irrelevant; layout polish comes in Change 3.
 */
export function UiSandbox() {
  const [modalOpen, setModalOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">UI primitive sandbox</h1>
        <p className="text-sm text-muted-foreground">
          Smoke test for the shadcn/base-ui port (Change 2).
        </p>
      </header>

      <Section title="Buttons & badges">
        <div className="flex flex-wrap items-center gap-2">
          <Button>Primary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <ButtonGroup>
            <Button variant="outline">One</Button>
            <Button variant="outline">Two</Button>
          </ButtonGroup>
          <Badge>Badge</Badge>
          <Kbd>⌘K</Kbd>
        </div>
      </Section>

      <Section title="Form inputs">
        <div className="grid max-w-md gap-3">
          <Field>
            <Label>Name</Label>
            <Input placeholder="Jane Doe" />
          </Field>
          <Field>
            <Label>Bio</Label>
            <Textarea placeholder="Tell us about yourself" />
          </Field>
          <Field>
            <Label>Role</Label>
            <NativeSelect>
              <option>Owner</option>
              <option>Admin</option>
            </NativeSelect>
          </Field>
          <div className="flex items-center gap-3">
            <Checkbox />
            <Label>I agree</Label>
            <Switch />
            <Toggle aria-label="Bold">B</Toggle>
          </div>
          <Slider defaultValue={[40]} />
        </div>
      </Section>

      <Section title="Surfaces">
        <div className="grid gap-3 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Card title</CardTitle>
              <CardDescription>Card description</CardDescription>
            </CardHeader>
            <CardContent>Card body content.</CardContent>
          </Card>
          <Alert>
            <AlertTitle>Heads up</AlertTitle>
            <AlertDescription>This is an alert.</AlertDescription>
          </Alert>
          <Empty>Nothing here yet</Empty>
          <Item>List item</Item>
          <AspectRatio ratio={16 / 9} className="bg-muted">
            <div className="grid h-full place-items-center">16:9</div>
          </AspectRatio>
        </div>
      </Section>

      <Section title="Feedback">
        <div className="flex flex-wrap items-center gap-3">
          <Spinner />
          <Progress value={60} className="w-40" />
          <Skeleton className="h-6 w-32" />
          <Avatar>
            <AvatarFallback>HS</AvatarFallback>
          </Avatar>
          <Separator orientation="vertical" className="h-6" />
        </div>
      </Section>

      <Section title="Disclosure & navigation">
        <div className="flex flex-col gap-3">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Sandbox</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Collapsible>
            <p className="text-sm">Collapsible primitive present.</p>
          </Collapsible>
          <Accordion>
            <p className="text-sm">Accordion primitive present.</p>
          </Accordion>
          <Tabs defaultValue="a">
            <p className="text-sm">Tabs primitive present.</p>
          </Tabs>
          <RadioGroup>
            <p className="text-sm">RadioGroup primitive present.</p>
          </RadioGroup>
          <ToggleGroup>
            <p className="text-sm">ToggleGroup primitive present.</p>
          </ToggleGroup>
        </div>
      </Section>

      <Section title="Overlays">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setModalOpen(true)}>
            Open ResponsiveModal
          </Button>
          <Button onClick={() => setSheetOpen(true)}>Open BottomSheet</Button>
          <Tooltip>
            <p className="text-xs">Tooltip primitive present.</p>
          </Tooltip>
          <HoverCard>
            <p className="text-xs">HoverCard primitive present.</p>
          </HoverCard>
          <Popover>
            <p className="text-xs">Popover primitive present.</p>
          </Popover>
          <Dialog>
            <p className="text-xs">Dialog primitive present.</p>
          </Dialog>
          <AlertDialog>
            <p className="text-xs">AlertDialog primitive present.</p>
          </AlertDialog>
          <Sheet>
            <p className="text-xs">Sheet primitive present.</p>
          </Sheet>
        </div>
        <ResponsiveModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Responsive modal"
        >
          <p className="text-sm">
            On mobile this is a bottom sheet; on desktop, a centered dialog.
          </p>
        </ResponsiveModal>
        <BottomSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title="Bottom sheet"
        >
          <p className="text-sm">Mobile-first surface.</p>
        </BottomSheet>
      </Section>

      <Section title="Calendar">
        <Calendar mode="single" />
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6 rounded-lg border border-border bg-card p-4">
      <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}
