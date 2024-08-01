package com.boilerclasses

import kotlinx.coroutines.delay
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.Semaphore
import java.util.concurrent.atomic.AtomicInteger
import kotlin.random.Random

//bored so i wrote suspending rwlock
// ( kotlin doesn't have one D: )
//based on go and essentially tries to make read operation as quick as possible at cost of literally everything else lmao

//absolutely garbage testing code (look away!)
//println("launching")
//var isWriting = false
//
//for (i in 0..1000000)
//launch {
//    delay((1000* Random.nextFloat()*4).toLong())
//    if (Random.nextBoolean()) lock.write {
//        isWriting=true
//        delay((1000* Random.nextFloat()*0.0002).toLong())
//        isWriting=false
//    }
//    else lock.read {
//        if (isWriting) throw RuntimeException("oh god")
//    }
//}
//
//println("gucci")

class RwLock {
    private val writeLock = Mutex()
    private val nreader = AtomicInteger(0)
    private val nreadersLeft = AtomicInteger(0)

    private val maxReader = Int.MAX_VALUE //safe, i think!
    //releasing before acquire triggers an exception if e.g. i use 1,1 here since released cannot be larger than # permits...
    private val readerSem = Semaphore(maxReader,maxReader)
    //only one writer at a time
    private val writerSem = Semaphore(1,1)

    suspend fun<R> read(f: suspend ()->R):R {
        if (nreader.incrementAndGet()<0)
            readerSem.acquire()

        try {
            return f()
        } finally {
            if (nreader.decrementAndGet()<0
                && nreadersLeft.decrementAndGet()==0) writerSem.release()
        }
    }

    suspend fun<R> write(f: suspend ()->R):R {
        writeLock.lock()
        val readers = nreader.getAndAdd(-maxReader)
        if (nreadersLeft.addAndGet(readers)>0)
            writerSem.acquire()

        try {
            return f()
        } finally {
            var waiting = nreader.addAndGet(maxReader)
            assert(waiting>=0)
            while (waiting-- >0) readerSem.release()
            writeLock.unlock()
        }
    }
}