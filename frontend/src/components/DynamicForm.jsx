import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from './ui/index.jsx';
import { Field, Input, Textarea, Select } from './ui/Field.jsx';

function validate(field) {
  const pattern = field.pattern
    ? new RegExp(field.pattern)
    : field.type === 'phone'
      ? /^[6-9]\d{9}$/
      : field.type === 'aadhaar'
        ? /^\d{12}$/
        : undefined;
  return {
    required: field.required ? `${field.label} is required` : false,
    minLength: field.min ? { value: field.min, message: `Min ${field.min} characters` } : undefined,
    maxLength: field.max ? { value: field.max, message: `Max ${field.max} characters` } : undefined,
    pattern: pattern ? { value: pattern, message: field.type === 'phone' ? 'Enter a valid 10-digit Indian mobile number' : field.type === 'aadhaar' ? 'Enter all 12 Aadhaar digits' : 'Invalid format' } : undefined,
  };
}

export default function DynamicForm({ schema, defaultValues = {}, onSubmit, submitLabel = 'Submit', loading }) {
  const fields = schema?.fields || [];
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ defaultValues });

  useEffect(() => { reset(defaultValues); }, [defaultValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {fields.map((f) => {
          const err = errors[f.name]?.message;
          const common = { invalid: !!err, ...register(f.name, validate(f)) };
          return (
            <div key={f.name} className={f.type === 'string' && f.max > 200 ? 'md:col-span-2' : ''}>
              <Field label={f.label} required={f.required} error={err}>
                {f.type === 'enum' ? (
                  <Select {...common}>
                    <option value="">Select…</option>
                    {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                  </Select>
                ) : f.type === 'string' && f.max > 200 ? (
                  <Textarea {...common} placeholder={f.label} />
                ) : (
                  <Input
                    {...common}
                    type={
                      f.type === 'email' ? 'email' :
                      f.type === 'date' ? 'date' :
                      f.type === 'number' ? 'number' :
                      f.type === 'phone' ? 'tel' : 'text'
                    }
                    placeholder={f.type === 'aadhaar' ? '0000 0000 0000' : f.label}
                    maxLength={f.type === 'aadhaar' ? 12 : f.type === 'phone' ? 10 : f.max}
                    inputMode={['aadhaar', 'phone', 'number'].includes(f.type) ? 'numeric' : undefined}
                  />
                )}
              </Field>
            </div>
          );
        })}
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" loading={loading}>{submitLabel}</Button>
      </div>
    </form>
  );
}
