import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import StoreLayout from "@/components/layout/StoreLayout";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/formatters";
import { generateOrderNumber } from "@/lib/formatters";
import { addressSchema, type AddressFormValues, indianStates } from "@/lib/validators";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ChevronRight, Loader2, CreditCard, Banknote, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Step = "address" | "payment" | "review";

const Checkout = () => {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<Step>("address");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [addressData, setAddressData] = useState<AddressFormValues | null>(null);

  const shippingCost = subtotal >= 999 ? 0 : 99;
  const codFee = paymentMethod === "cod" ? 49 : 0;
  const gstAmount = Math.round((subtotal * 18) / 118);
  const total = subtotal + shippingCost + codFee;

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      pincode: "",
    },
  });

  const handleAddressSubmit = (values: AddressFormValues) => {
    setAddressData(values);
    setCurrentStep("payment");
  };

  const handlePlaceOrder = async () => {
    if (!addressData || items.length === 0) return;

    setIsPlacingOrder(true);

    try {
      const orderNumber = generateOrderNumber();
      const shippingAddress = {
        full_name: addressData.fullName,
        phone: addressData.phone,
        address_line1: addressData.addressLine1,
        address_line2: addressData.addressLine2 || "",
        city: addressData.city,
        state: addressData.state,
        pincode: addressData.pincode,
      };

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          user_id: user?.id || null,
          subtotal,
          shipping_amount: shippingCost,
          gst_amount: gstAmount,
          cod_fee: codFee,
          total_amount: total,
          payment_method: paymentMethod as any,
          payment_status: paymentMethod === "cod" ? "pending" : "pending",
          status: "pending",
          shipping_address: shippingAddress,
          billing_address: shippingAddress,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        variant_id: item.variantId,
        product_name: item.name,
        variant_info: item.variantInfo,
        sku: item.sku,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        gst_rate: 18,
        gst_amount: Math.round((item.price * item.quantity * 18) / 118),
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      clearCart();

      toast({
        title: "Order placed successfully!",
        description: `Order #${orderNumber}`,
      });

      navigate(`/order-confirmation/${orderNumber}`);
    } catch (error: any) {
      toast({
        title: "Failed to place order",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (items.length === 0) {
    return (
      <StoreLayout>
        <div className="pt-32 pb-20 min-h-screen container max-w-lg text-center">
          <h1 className="font-display text-2xl mb-4">Your bag is empty</h1>
          <Button asChild>
            <Link to="/">Continue Shopping</Link>
          </Button>
        </div>
      </StoreLayout>
    );
  }

  const steps: { key: Step; label: string }[] = [
    { key: "address", label: "Address" },
    { key: "payment", label: "Payment" },
    { key: "review", label: "Review" },
  ];

  return (
    <StoreLayout>
      <div className="pt-32 pb-20">
        <div className="container max-w-4xl">
          {/* Steps */}
          <div className="flex items-center justify-center gap-4 mb-10">
            {steps.map((step, i) => (
              <div key={step.key} className="flex items-center gap-4">
                <button
                  onClick={() => {
                    if (step.key === "address") setCurrentStep("address");
                    if (step.key === "payment" && addressData) setCurrentStep("payment");
                  }}
                  className={cn(
                    "flex items-center gap-2 text-xs tracking-widest",
                    currentStep === step.key
                      ? "text-foreground font-medium"
                      : "text-foreground/40"
                  )}
                >
                  <span
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-[10px]",
                      currentStep === step.key
                        ? "bg-foreground text-background"
                        : "border border-foreground/30"
                    )}
                  >
                    {i + 1}
                  </span>
                  {step.label.toUpperCase()}
                </button>
                {i < steps.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-foreground/20" />
                )}
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-5 gap-10">
            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Address Step */}
              {currentStep === "address" && (
                <div>
                  <h2 className="font-display text-xl mb-6">Shipping Address</h2>
                  {!user && (
                    <p className="text-sm text-foreground/60 mb-6">
                      <Link to="/auth" className="underline">Sign in</Link> for a faster checkout experience
                    </p>
                  )}
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleAddressSubmit)} className="space-y-4">
                      <FormField control={form.control} name="fullName" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs tracking-widest text-foreground/70">FULL NAME</FormLabel>
                          <FormControl><Input className="h-11" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs tracking-widest text-foreground/70">MOBILE NUMBER</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-foreground/50">+91</span>
                              <Input className="h-11 pl-12" maxLength={10} {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="addressLine1" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs tracking-widest text-foreground/70">ADDRESS LINE 1</FormLabel>
                          <FormControl><Input className="h-11" placeholder="House/Flat No., Building" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="addressLine2" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs tracking-widest text-foreground/70">ADDRESS LINE 2 (OPTIONAL)</FormLabel>
                          <FormControl><Input className="h-11" placeholder="Street, Landmark" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="city" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs tracking-widest text-foreground/70">CITY</FormLabel>
                            <FormControl><Input className="h-11" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />

                        <FormField control={form.control} name="pincode" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs tracking-widest text-foreground/70">PINCODE</FormLabel>
                            <FormControl><Input className="h-11" maxLength={6} {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>

                      <FormField control={form.control} name="state" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs tracking-widest text-foreground/70">STATE</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-11"><SelectValue placeholder="Select state" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {indianStates.map((state) => (
                                <SelectItem key={state} value={state}>{state}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <Button type="submit" className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 text-xs tracking-widest">
                        CONTINUE TO PAYMENT
                      </Button>
                    </form>
                  </Form>
                </div>
              )}

              {/* Payment Step */}
              {currentStep === "payment" && (
                <div>
                  <h2 className="font-display text-xl mb-6">Payment Method</h2>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                    <div className={cn("flex items-center gap-4 p-4 border rounded-md cursor-pointer", paymentMethod === "cod" ? "border-foreground" : "border-border/50")}>
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="cursor-pointer flex-1">
                        <div className="flex items-center gap-3">
                          <Banknote className="h-5 w-5 text-foreground/60" />
                          <div>
                            <p className="font-medium text-sm">Cash on Delivery</p>
                            <p className="text-xs text-foreground/50">Pay when your order arrives (+₹49 COD fee)</p>
                          </div>
                        </div>
                      </Label>
                    </div>

                    <div className={cn("flex items-center gap-4 p-4 border rounded-md cursor-pointer", paymentMethod === "upi" ? "border-foreground" : "border-border/50")}>
                      <RadioGroupItem value="upi" id="upi" />
                      <Label htmlFor="upi" className="cursor-pointer flex-1">
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-5 w-5 text-foreground/60" />
                          <div>
                            <p className="font-medium text-sm">UPI / Card / Net Banking</p>
                            <p className="text-xs text-foreground/50">Pay securely via Razorpay (Coming soon)</p>
                          </div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>

                  <div className="flex gap-4 mt-8">
                    <Button variant="outline" onClick={() => setCurrentStep("address")} className="flex-1 h-12 text-xs tracking-widest">
                      BACK
                    </Button>
                    <Button onClick={() => setCurrentStep("review")} className="flex-1 h-12 bg-foreground text-background hover:bg-foreground/90 text-xs tracking-widest">
                      REVIEW ORDER
                    </Button>
                  </div>
                </div>
              )}

              {/* Review Step */}
              {currentStep === "review" && addressData && (
                <div>
                  <h2 className="font-display text-xl mb-6">Review Your Order</h2>

                  {/* Shipping Address */}
                  <div className="border border-border/30 rounded-md p-4 mb-6">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xs tracking-widest text-foreground/70 mb-2">SHIPPING ADDRESS</h3>
                      <button onClick={() => setCurrentStep("address")} className="text-xs underline text-foreground/60">Edit</button>
                    </div>
                    <p className="text-sm">{addressData.fullName}</p>
                    <p className="text-sm text-foreground/70">{addressData.addressLine1}</p>
                    {addressData.addressLine2 && <p className="text-sm text-foreground/70">{addressData.addressLine2}</p>}
                    <p className="text-sm text-foreground/70">{addressData.city}, {addressData.state} - {addressData.pincode}</p>
                    <p className="text-sm text-foreground/70">+91 {addressData.phone}</p>
                  </div>

                  {/* Payment Method */}
                  <div className="border border-border/30 rounded-md p-4 mb-6">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xs tracking-widest text-foreground/70 mb-2">PAYMENT METHOD</h3>
                      <button onClick={() => setCurrentStep("payment")} className="text-xs underline text-foreground/60">Edit</button>
                    </div>
                    <p className="text-sm">{paymentMethod === "cod" ? "Cash on Delivery" : "UPI / Card / Net Banking"}</p>
                  </div>

                  {/* Items */}
                  <div className="border border-border/30 rounded-md p-4 mb-6">
                    <h3 className="text-xs tracking-widest text-foreground/70 mb-4">ORDER ITEMS ({items.length})</h3>
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div key={item.variantId} className="flex gap-3">
                          <img src={item.imageUrl} alt={item.name} className="w-14 h-18 object-cover" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.name}</p>
                            <p className="text-xs text-foreground/50">{item.variantInfo} × {item.quantity}</p>
                          </div>
                          <p className="text-sm font-medium">{formatPrice(item.price * item.quantity)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handlePlaceOrder}
                    disabled={isPlacingOrder}
                    className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 text-xs tracking-widest"
                  >
                    {isPlacingOrder ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> PLACING ORDER...</>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        PLACE ORDER — {formatPrice(total)}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-2">
              <div className="sticky top-32 border border-border/30 rounded-md p-6 space-y-4">
                <h3 className="font-display text-lg">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-foreground/70">Subtotal</span><span>{formatPrice(subtotal)}</span></div>
                  <div className="flex justify-between"><span className="text-foreground/70">Shipping</span><span>{shippingCost === 0 ? <span className="text-green-600">FREE</span> : formatPrice(shippingCost)}</span></div>
                  <div className="flex justify-between"><span className="text-foreground/70">GST (18%)</span><span>{formatPrice(gstAmount)}</span></div>
                  {codFee > 0 && <div className="flex justify-between"><span className="text-foreground/70">COD Fee</span><span>{formatPrice(codFee)}</span></div>}
                </div>
                <div className="border-t border-border/30 pt-3">
                  <div className="flex justify-between text-lg font-medium"><span>Total</span><span>{formatPrice(total)}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
};

export default Checkout;
