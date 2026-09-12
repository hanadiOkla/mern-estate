import React from 'react';

function ListingSkeleton() {
  return (
    <div className='border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white animate-pulse'>
      <div className='flex items-center gap-4 w-full sm:w-auto min-w-0 flex-1'>
        {/* صورة وهمية */}
        <div className='h-20 w-24 bg-slate-200 rounded-xl shrink-0' />
        
        {/* تفاصيل هامة وهمية */}
        <div className='flex flex-col gap-2.5 w-full min-w-0 flex-1'>
          <div className='h-4 bg-slate-200 rounded-md w-3/4' />
          <div className='h-3 bg-slate-200 rounded-md w-1/2' />
          <div className='flex items-center gap-2 mt-1'>
            <div className='h-5 bg-slate-200 rounded-full w-20' />
            <div className='h-3 bg-slate-200 rounded-md w-12' />
          </div>
        </div>
      </div>

      {/* أزرار الإجراءات وهمية */}
      <div className='flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 shrink-0'>
        <div className='h-8 w-20 bg-slate-200 rounded-xl' />
        <div className='h-8 w-20 bg-slate-200 rounded-xl' />
      </div>
    </div>
  );
}

export default ListingSkeleton;