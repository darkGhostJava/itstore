"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { PlusCircle, Trash2 } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  getAllDirections,
  getSubDirectionsOfDirection,
  getPersonsByIdStructure,
  searchArticles,
  searchItemsBySerialNumber,
} from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Article, Item, Person, Structure } from "@/lib/definitions";
import { api } from "@/lib/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

const articleDistributionSchema = z.object({
  article: z.any().refine(val => val, { message: "Please select an article." }),
  serialNumbers: z.array(z.string()).optional(),
  quantity: z.number().optional(),
});

const distributionFormSchema = z.object({
  structureId: z.string().min(1, "Please select a direction."),
  subDirectionId: z.string().min(1, "Please select a sub direction."),
  beneficiaryId: z.string().min(1, "Please select a beneficiary."),
  remarks: z.string().optional(),
  articles: z.array(articleDistributionSchema).min(1, "Please add at least one article."),
});

type DistributionFormValues = z.infer<typeof distributionFormSchema>;

// Helper to parse multipart/mixed response
async function parseMultipartResponse(response: any) {
    const contentType = response.headers['content-type'];
    if (!contentType || !contentType.includes('boundary=')) {
        throw new Error('Invalid multipart response: boundary not found');
    }
    const boundary = contentType.split('boundary=')[1];
    const parts = response.data.split(`--${boundary}`);

    const files: { filename: string, blob: Blob }[] = [];

    for (const part of parts) {
        if (part.includes('Content-Disposition')) {
            const contentDispositionMatch = part.match(/Content-Disposition: form-data; name="([^"]+)"/);
            if (contentDispositionMatch) {
                const name = contentDispositionMatch[1];
                
                // Find where the headers end and the content begins
                const headerEndIndex = part.indexOf('\r\n\r\n');
                if (headerEndIndex === -1) continue;

                // Extract the content after the headers, removing leading/trailing whitespace
                const content = part.substring(headerEndIndex + 4).trim();
                
                if (!content) continue;

                try {
                    // atob requires a pure base64 string.
                    const byteCharacters = atob(content);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
                    files.push({ filename: `${name}_decharge.docx`, blob });
                } catch (e) {
                    console.error("Failed to decode base64 string for part:", name, e);
                    throw e; // re-throw the error to be caught by the onSubmit handler
                }
            }
        }
    }
    return files;
}

export function AddDistribution() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [searchedArticles, setSearchedArticles] = useState<Article[]>([]);
  const [directions, setDirections] = useState<Structure[]>([]);
  const [subDirections, setSubDirections] = useState<Structure[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [serials, setSerials] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchArticleType, setSearchArticleType] = useState<"ALL" | "HARDWARE" | "CONSUMABLE">("ALL");

  
  const form = useForm<DistributionFormValues>({
    resolver: zodResolver(distributionFormSchema),
    defaultValues: {
      structureId: "",
      subDirectionId: "",
      beneficiaryId: "",
      remarks: "",
      articles: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "articles",
  });

  // Load directions
  useEffect(() => {
    (async () => {
      const res = await getAllDirections();
      setDirections(res.data || []);
    })();
  }, []);

  const selectedStructureId = form.watch("structureId");
  const selectedSubDirectionId = form.watch("subDirectionId");

  // Fetch sub-directions when structure changes
  useEffect(() => {
    const fetchSubDirections = async () => {
      form.resetField("subDirectionId");
      form.resetField("beneficiaryId");
      setSubDirections([]);
      setPersons([]);
      if (selectedStructureId) {
        const res = await getSubDirectionsOfDirection(parseInt(selectedStructureId));
        setSubDirections(res.data || []);
      }
    };
    fetchSubDirections();
  }, [selectedStructureId, form]);

  // Fetch beneficiaries when sub-direction changes
  useEffect(() => {
    const fetchPersons = async () => {
      form.resetField("beneficiaryId");
      setPersons([]);
      if (selectedSubDirectionId) {
        const res = await getPersonsByIdStructure(parseInt(selectedSubDirectionId));
        setPersons(res.data || []);
      }
    };
    fetchPersons();
  }, [selectedSubDirectionId, form]);

  // Submit handler
  async function onSubmit(values: DistributionFormValues) {
    setLoading(true);
    try {
      const hardwares: { [key: number]: string[] } = {};
      const consumables: { [key: number]: number } = {};

      values.articles.forEach(dist => {
        if (dist.article.type === 'HARDWARE' && dist.serialNumbers && dist.serialNumbers.length > 0) {
          hardwares[dist.article.id] = dist.serialNumbers;
        } else if (dist.article.type === 'CONSUMABLE' && dist.quantity && dist.quantity > 0) {
          consumables[dist.article.id] = dist.quantity;
        }
      });
      
      const payload = {
        personId: parseInt(values.beneficiaryId),
        remarks: values.remarks,
        userId: 1, // Assuming a logged-in user
        hardwares,
        consumables,
      };

      const response = await api.post("/distributions", payload, {
        responseType: "text", // Expect a multipart response as text
        headers: {
            'Accept': 'multipart/mixed'
        }
      });
      
      const files = await parseMultipartResponse(response);

      files.forEach(file => {
          const url = window.URL.createObjectURL(file.blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = file.filename;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
      });


      toast({
        title: "Distribution Added",
        description: "Distribution recorded and document(s) downloaded successfully.",
      });

      form.reset();
      remove(); // Clear all appended fields
      setOpen(false);
    } catch (error) {
      console.error("Error adding distribution:", error);
      toast({
        title: "Error",
        description: "Failed to add distribution or download files.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleArticleSearch = async (query: string) => {
    if (query.length > 1) {
      const res = await searchArticles(query, searchArticleType);
      setSearchedArticles(res.data || []);
    } else {
      setSearchedArticles([]);
    }
  };

  const handleSerialSearch = async (serialNumber: string, articleId: number) => {
     if (serialNumber.length > 0 && articleId) {
        const res = await searchItemsBySerialNumber(serialNumber, articleId);
        setSerials(res || []);
      } else {
        setSerials([]);
      }
  }

  const handleSelectSerial = (serial: Item, fieldIndex: number) => {
    const currentSerials = form.getValues(`articles.${fieldIndex}.serialNumbers`) || [];
    if (!currentSerials.includes(serial.serialNumber)) {
        form.setValue(`articles.${fieldIndex}.serialNumbers`, [...currentSerials, serial.serialNumber]);
    }
    setSerials([]);
    // This is a workaround to clear the input. A better way would be to manage the input's state separately.
    const serialInput = document.getElementById(`serial-search-${fieldIndex}`);
    if (serialInput) (serialInput as HTMLInputElement).value = '';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Distribution
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Distribution</DialogTitle>
          <DialogDescription>
            Record a new distribution of items. Select a beneficiary then add articles.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Beneficiary Selection */}
              <div className="grid grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="structureId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Structure</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a structure" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {directions.map((structure) => (
                              <SelectItem key={structure.id} value={structure.id.toString()}>
                                {structure.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                <FormField
                  control={form.control}
                  name="subDirectionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sub Direction</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!selectedStructureId || subDirections.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a sub direction" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subDirections.map((sub) => (
                            <SelectItem key={sub.id} value={sub.id.toString()}>
                              {sub.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

               <FormField
                  control={form.control}
                  name="beneficiaryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Beneficiary</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!selectedSubDirectionId || persons.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a beneficiary" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {persons.map((person) => (
                            <SelectItem key={person.id} value={person.id.toString()}>
                              {person.firstName} {person.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              <div className="space-y-4">
                <FormLabel>Articles to Distribute</FormLabel>
                <div className="space-y-4">
                  {fields.map((field, index) => {
                     const articleType = form.getValues(`articles.${index}.article.type`);
                     return (
                    <div key={field.id} className="rounded-md border p-4 space-y-4 relative">
                      <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => remove(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                      
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{form.getValues(`articles.${index}.article.model`)} - <span className="text-xs text-muted-foreground">{form.getValues(`articles.${index}.article.designation`)}</span></p>
                        <Badge variant={articleType === "HARDWARE" ? "default" : "secondary"}>
                          {articleType}
                        </Badge>
                      </div>

                      {articleType === 'HARDWARE' && (
                        <FormField
                            control={form.control}
                            name={`articles.${index}.serialNumbers`}
                            render={({ field: serialField }) => (
                              <FormItem>
                                <FormLabel>Serial Numbers</FormLabel>
                                <div className="relative">
                                  <Input
                                  id={`serial-search-${index}`}
                                  placeholder="Search and add serial numbers..."
                                  onChange={(e) => handleSerialSearch(e.target.value, form.getValues(`articles.${index}.article.id`))}
                                  />
                                  {serials.length > 0 && (
                                  <div className="absolute z-10 w-full rounded border bg-background shadow-md mt-1 max-h-48 overflow-y-auto">
                                      {serials.map((serial) => (
                                      <div
                                          key={serial.id}
                                          className="p-2 cursor-pointer hover:bg-muted"
                                          onClick={() => handleSelectSerial(serial, index)}
                                      >
                                          {serial.serialNumber}
                                      </div>
                                      ))}
                                  </div>
                                  )}
                              </div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {serialField.value?.map((sn) => (
                                    <span
                                      key={sn}
                                      className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1"
                                    >
                                      {sn}
                                      <button
                                        type="button"
                                        className="text-destructive hover:text-red-500"
                                        onClick={() => serialField.onChange(serialField.value?.filter((v) => v !== sn))}
                                      >
                                        &times;
                                      </button>
                                    </span>
                                  ))}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                      )}

                      {articleType === 'CONSUMABLE' && (
                          <FormField
                              control={form.control}
                              name={`articles.${index}.quantity`}
                              render={({ field }) => (
                                  <FormItem>
                                  <FormLabel>Quantity</FormLabel>
                                  <FormControl>
                                      <Input
                                      type="number"
                                      min={1}
                                      placeholder="Enter quantity"
                                      {...field}
                                      onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 1)}
                                      />
                                  </FormControl>
                                  <FormMessage />
                                  </FormItem>
                              )}
                          />
                      )}
                    </div>
                     )
                  })}
                </div>
                
                <div className="relative space-y-2">
                    <div className="flex gap-2">
                         <Select 
                            value={searchArticleType}
                            onValueChange={(value: "ALL" | "HARDWARE" | "CONSUMABLE") => setSearchArticleType(value)}
                        >
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Select Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Types</SelectItem>
                                <SelectItem value="HARDWARE">Hardware</SelectItem>
                                <SelectItem value="CONSUMABLE">Consumable</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input
                            id="article-search"
                            placeholder="Search for an article to add..."
                            onChange={(e) => handleArticleSearch(e.target.value)}
                            onBlur={() => setTimeout(() => setSearchedArticles([]), 150)}
                            className="flex-1"
                        />
                    </div>
                    {searchedArticles.length > 0 && (
                        <div className="absolute z-10 w-full rounded border bg-background shadow-md mt-1 max-h-56 overflow-y-auto">
                            {searchedArticles.map((article) => (
                                <div
                                key={article.id}
                                className="p-2 cursor-pointer hover:bg-muted"
                                onMouseDown={() => { // use onMouseDown to fire before blur
                                    append({ article: article, serialNumbers: [], quantity: 1 });
                                    setSearchedArticles([]);
                                    const articleInput = document.getElementById('article-search');
                                    if(articleInput) (articleInput as HTMLInputElement).value = '';
                                }}
                                >
                                {article.model} ({article.type})
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                 <FormMessage>
                    {form.formState.errors.articles && typeof form.formState.errors.articles.message === 'string' && form.formState.errors.articles.message}
                </FormMessage>
              </div>

              {/* Remarks */}
              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Add any relevant remarks..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Distribution"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
