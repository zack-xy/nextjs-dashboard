'use server';

import { z } from 'zod';
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import postgres from "postgres";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' })

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: '请选择一个客户'
  }),
  amount: z.coerce.number().gt(0, {message: '金额必须大于0'}),
  status: z.enum(['pending', 'paid'], {
    required_error: '状态是必填项',
    invalid_type_error: '请选择一个状态',
  }),
  date: z.string(),
})


// 新增发票
const CreateInvoice = FormSchema.omit({ id: true, date: true })
export async function createInvoice(prevState: State, formData: FormData) {
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  })


  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "缺失字段，无法创建"
    }
  }

  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch (error) {
    return {
      message: "数据库错误：创建失败"
    }
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');

}



// 更新发票
const UpdateInvoice = FormSchema.omit({ id: true, date: true })
export async function updateInvoice(id: string, prevState: State, formData: FormData) {
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  })

  if(!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "缺失字段，无法更新"
    }
  }

  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;

  // console.log("update", customerId, amountInCents, status);

  try {
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;
  } catch (error) {
    return { message: "数据库错误：无法更新" }
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

// 删除发票
export async function deleteInvoice(id: string) {

  // throw new Error('Failed to Delete Invoice');

  await sql`DELETE FROM invoices WHERE id = ${id}`;
  console.log("Deleted invoice with id:", id);
  revalidatePath('/dashboard/invoices');
}

export async function authenticate(prevState: string | undefined, formData: FormData) {
  try {
    await signIn('credentials', formData)
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.'
      }
    }
    throw error;
  }
}

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null; 
}
