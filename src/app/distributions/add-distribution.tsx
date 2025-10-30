"use client";

import { useState, useEffect, useMemo } from "react";
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
import { PlusCircle } from "lucide-react";
import { useForm } from "react-hook-form";
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

// ✅ Base schema
const baseSchema = {
  articleType: z.string().min(1, "Please select an article type."),
  articleId: z.string().min(1, "Please select an article."),
  structureId: z.string().min(1, "Please select a direction."),
  subDirectionId: z.string().min(1, "Please select a sub direction."),
  beneficiaryId: z.string().min(1, "Please select a beneficiary."),
  remarks: z.string().optional(),
};

// ✅ Hardware schema
const hardwareSchema = z.object({
  ...baseSchema,
  serialNumbers: z.array(z.string()).min(1, "Select at least one serial number."),
  quantity: z.number().optional(),
});

// ✅ Consumable schema
const consumableSchema = z.object({
  ...baseSchema,
  quantity: z
    .number({ required_error: "Enter quantity" })
    .min(1, "Quantity must be at least 1"),
  serialNumbers: z.array(z.string()).optional(),
});

export function AddDistribution() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [articles, setArticles] = useState<Article[]>([]);
  const [directions, setDirections] = useState<Structure[]>([]);
  const [subDirections, setSubDirections] = useState<Structure[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [serials, setSerials] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [articleType, setArticleType] = useState<string>("");

  // ✅ Dynamic schema based on articleType
  const schema = useMemo(
    () => (articleType === "CONSUMABLE" ? consumableSchema : hardwareSchema),
    [articleType]
  );

  // ✅ Initialize form with correct schema
  const form = useForm<z.infer<typeof hardwareSchema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      articleType: "",
      articleId: "",
      structureId: "",
      subDirectionId: "",
      beneficiaryId: "",
      remarks: "",
      serialNumbers: [],
      quantity: 1,
    },
  });

  const articleTypes = [
    { value: "HARDWARE", label: "Hardware" },
    { value: "CONSUMABLE", label: "Consumable" },
  ];

  // ✅ Load directions
  useEffect(() => {
    (async () => {
      const res = await getAllDirections();
      setDirections(res.data || []);
    })();
  }, []);

  const selectedStructureId = form.watch("structureId");
  const selectedSubDirectionId = form.watch("subDirectionId");

  // ✅ Sub directions
  useEffect(() => {
    const fetchSubDirections = async () => {
      form.resetField("subDirectionId");
      const res = await getSubDirectionsOfDirection(parseInt(selectedStructureId));
      setSubDirections(res.data || []);
    };
    if (selectedStructureId) fetchSubDirections();
  }, [selectedStructureId]);

  // ✅ Beneficiaries
  useEffect(() => {
    const fetchPersons = async () => {
      form.resetField("beneficiaryId");
      const res = await getPersonsByIdStructure(parseInt(selectedSubDirectionId));
      setPersons(res.data || []);
    };
    if (selectedSubDirectionId) fetchPersons();
  }, [selectedSubDirectionId]);

  // ✅ Reset serials when article changes
  useEffect(() => {
    setSerials([]);
    form.setValue("serialNumbers", []);
  }, [form.watch("articleId")]);

  // ✅ Submit handler
  async function onSubmit(values: any) {
    setLoading(true);
    try {
      const payload = {
        ...values,
        articleId: parseInt(values.articleId),
        structureId: parseInt(values.structureId),
        personId: parseInt(values.beneficiaryId),
        date: new Date().toISOString(),
        userId: 1,
        type: "DISTRIBUTION",
      };

      const response = await api.post("/distributions", payload, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `decharge_${Date.now()}.docx`;
      link.target = "_blank";
      link.click();

      toast({
        title: "Distribution Added",
        description: `Distribution recorded successfully.`,
      });

      form.reset();
      setOpen(false);
    } catch (error) {
      console.error("Error adding distribution:", error);
      toast({
        title: "Error",
        description: "Failed to add distribution.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  // ✅ Render component
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Distribution
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Distribution</DialogTitle>
          <DialogDescription>
            Record a new distribution of items.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Article Type */}
              <FormField
                control={form.control}
                name="articleType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Article Type</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setArticleType(value);
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select article type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {articleTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Article Search */}
              <FormField
                control={form.control}
                name="articleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Article</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Search article" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <div className="p-2">
                          <Input
                            placeholder="Type to search..."
                            disabled={!articleType}
                            onChange={async (e) => {
                              const q = e.target.value;
                              if (q.length > 1) {
                                console.log(q);
                                
                                const res = await searchArticles(q, articleType);
                                
                                setArticles(res.data || []);
                              } else {
                                setArticles([]);
                              }
                            }}
                          />
                        </div>
                        <div className="border-t my-1"></div>
                        {articles.length > 0 ? (
                          articles.map((article) => (
                            <SelectItem key={article.id} value={article.id.toString()}>
                              {article.model}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-sm text-gray-500">No results</div>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Conditional Fields */}
              {articleType === "HARDWARE" ? (
                <FormField
                  control={form.control}
                  name="serialNumbers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serial Numbers</FormLabel>
                      <div className="relative">
                        <Input
                          placeholder="Search serial numbers..."
                          disabled={!form.watch("articleId")}
                          onChange={async (e) => {
                            const query = e.target.value;
                            const articleId = parseInt(form.watch("articleId"));
                            if (query.length > 0 && articleId) {
                              const res = await searchItemsBySerialNumber(query, articleId);
                              setSerials(res || []);
                            } else {
                              setSerials([]);
                            }
                          }}
                        />
                        {serials.length > 0 && (
                          <div className="absolute z-10 bg-white border rounded w-full max-h-56 overflow-y-auto shadow-md mt-1">
                            {serials.map((serial) => {
                              const selected = field.value.includes(serial.serialNumber.toString());
                              return (
                                <div
                                  key={serial.serialNumber}
                                  className={`flex items-center justify-between p-2 cursor-pointer hover:bg-gray-100 ${
                                    selected ? "bg-blue-50" : ""
                                  }`}
                                  onClick={() => {
                                    if (selected) {
                                      field.onChange(
                                        field.value.filter(
                                          (id) => id !== serial.serialNumber.toString()
                                        )
                                      );
                                    } else {
                                      field.onChange([
                                        ...field.value,
                                        serial.serialNumber.toString(),
                                      ]);
                                    }
                                    setSerials([]);
                                  }}
                                >
                                  <span>{serial.serialNumber}</span>
                                  {selected && (
                                    <span className="text-blue-600 text-xs">✓</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      {/* <div className="mt-2 flex flex-wrap gap-2">
                        {field.value.map((id) => (
                          <span
                            key={id}
                            className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full flex items-center gap-1"
                          >
                            {id}
                            <button
                              type="button"
                              className="text-blue-500 hover:text-red-500"
                              onClick={() =>
                                field.onChange(field.value.filter((v) => v !== id))
                              }
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div> */}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                articleType === "CONSUMABLE" && (
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            placeholder="Enter quantity"
                            value={field.value}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 1)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )
              )}
            </div>

            {/* Structure */}
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

            {/* Sub-direction */}
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

            {/* Beneficiary */}
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

            {/* Remarks */}
            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add remarks..." {...field} />
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
      </DialogContent>
    </Dialog>
  );
}
